import axios from "axios";
import OpenAI, {
  AuthenticationError,
  RateLimitError,
  APIConnectionError,
  APIConnectionTimeoutError,
} from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AnalysisSchema, AnalysisOutput, ANALYSIS_FALLBACK } from "../schemas/analysis.schema";
import { repairJson } from "./jsonRepair.service";
import fs from "fs";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;
const GEMINI_PRIMARY_MODEL = "gemini-3-flash-preview";
const GEMINI_FALLBACK_MODEL = "gemini-1.5-flash";

const SYSTEM_PROMPT = `You are a healthcare analysis assistant.

Your job is to analyze either a patient-care coordinator call transcript or a medical prescription image/text and return only structured JSON.

Rules:
1. Do not invent facts.
2. If something is unclear, say "unclear".
3. Be concise but accurate.
4. Extract patient concerns, actionable insights, or medication details.
5. If analyzing a prescription, identify medications, dosages, frequency, usage cause, and any age limits.
6. Return valid JSON only. No markdown, no explanation, no code fences.`;

const buildUserPrompt = (
  content: string,
  type: "call" | "prescription",
  language: string = "en",
  confidence?: number,
  qualityFlags?: string[]
): string => {
  if (type === "call") {
    return `Analyze the following patient-care coordinator call transcript.

Transcript:
"""
${content}
"""

Transcript metadata:
- language: ${language}
- transcript_confidence: ${confidence !== undefined ? confidence.toFixed(2) : "unknown"}
- quality_flags: ${qualityFlags && qualityFlags.length > 0 ? qualityFlags.join(", ") : "none"}

Return JSON in this structure:
{
  "callSummary": "string",
  "patientConcerns": ["string"],
  "patientIntent": "string",
  "disposition": "string",
  "followUpRequired": true,
  "followUpTimeline": "string",
  "risksBarriers": ["string"],
  "missedOpportunities": ["string"],
  "recommendedNextAction": "string",
  "evidenceLines": { ... },
  "confidenceScore": 0.0,
  "uncertaintyNotes": ["string"]
}`;
  } else {
    return `Analyze the following medical prescription (which may be hard to read). Extract all medication details.

Content:
"""
${content}
"""

Return JSON in this structure:
{
  "callSummary": "Overview of the prescription and its purpose",
  "patientConcerns": ["Any specific patient instructions or notes on the prescription"],
  "patientIntent": "The primary intent of the prescription (e.g., treat infection)",
  "disposition": "Instructions for the patient (e.g., take with food)",
  "followUpRequired": false,
  "followUpTimeline": "none",
  "risksBarriers": ["Any potential side effects or contraindications mentioned"],
  "missedOpportunities": [],
  "recommendedNextAction": "Clear instruction for the patient",
  "medications": [
    {
      "name": "Medication Name",
      "dosage": "Dosage (e.g., 500mg)",
      "frequency": "Frequency (e.g., twice daily)",
      "usageCause": "What this medication is used for (be specific)",
      "ageLimit": "Any age restrictions mentioned (e.g., adults only, not for children under 12)"
    }
  ],
  "confidenceScore": 0.0,
  "uncertaintyNotes": ["Any parts of the prescription that were hard to read or unclear"]
}`;
  }
};

const parseAndValidate = async (rawText: string): Promise<AnalysisOutput | null> => {
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    const result = AnalysisSchema.safeParse(parsed);
    if (result.success) return result.data;
    logger.warn("Zod validation failed", { errors: result.error.errors });
    return null;
  } catch {
    logger.warn("JSON.parse failed on LLM response");
    return null;
  }
};

const createStatusError = (message: string, statusCode: number): Error & { statusCode?: number } => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

const getLlmProvider = () => {
  if (env.LLM_PROVIDER === "auto") {
    return env.GEMINI_API_KEY ? "gemini" : "openai";
  }
  return env.LLM_PROVIDER;
};

const buildAnalysisError = (error: any): Error & { statusCode?: number } => {
  const status = error.statusCode || error.response?.status || error.status;
  const message = error.message || "Analysis request failed";

  if (status === 401 || status === 403) return createStatusError("AI authentication failed.", 401);
  if (status === 429) return createStatusError("AI quota exceeded.", 429);
  if (status && status >= 500) return createStatusError("AI service unavailable.", 503);
  if (message.includes("503")) return createStatusError("AI service unavailable (503).", 503);

  return error instanceof Error ? error : new Error("Unknown analysis error");
};

const generateWithGemini = async (prompt: string, modelName: string = GEMINI_PRIMARY_MODEL, imagePath?: string) => {
  if (!genAI) {
    throw createStatusError("Gemini analysis is not configured.", 500);
  }

  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
  });

  const parts: any[] = [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }];

  if (imagePath && fs.existsSync(imagePath)) {
    const imageData = fs.readFileSync(imagePath);
    parts.push({
      inlineData: {
        data: imageData.toString("base64"),
        mimeType: imagePath.endsWith(".png") ? "image/png" : "image/jpeg"
      }
    });
  }

  const result = await model.generateContent({ contents: [{ role: "user", parts }] });
  const response = await result.response;
  return response.text();
};

export const analyzeTranscriptWithLLM = async (payload: {
  transcript: string;
  type?: "call" | "prescription";
  imagePath?: string;
  language?: string;
  confidence?: number;
  qualityFlags?: string[];
}): Promise<AnalysisOutput> => {
  const { transcript, type = "call", imagePath, language = "en", confidence, qualityFlags } = payload;
  const provider = getLlmProvider();
  const prompt = buildUserPrompt(transcript, type, language, confidence, qualityFlags);
  
  let firstRaw = "";
  let retryCount = 0;
  let currentModel = GEMINI_PRIMARY_MODEL;

  while (retryCount <= 3) {
    try {
      if (provider === "gemini") {
        firstRaw = await generateWithGemini(prompt, currentModel, imagePath);
      } else {
        const response = await openai!.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });
        firstRaw = response.choices[0]?.message?.content || "";
      }
      break;
    } catch (error: any) {
      if (retryCount < 3 && (error.message.includes("503") || error.message.includes("429"))) {
        retryCount++;
        if (error.message.includes("503") && currentModel === GEMINI_PRIMARY_MODEL) currentModel = GEMINI_FALLBACK_MODEL;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount - 1)));
        continue;
      }
      throw buildAnalysisError(error);
    }
  }

  const firstResult = await parseAndValidate(firstRaw);
  if (firstResult) return firstResult;

  const repairedRaw = await repairJson(firstRaw);
  const repairedResult = await parseAndValidate(repairedRaw);
  return repairedResult || ANALYSIS_FALLBACK;
};
