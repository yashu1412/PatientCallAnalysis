"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTranscriptWithLLM = void 0;
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importStar(require("openai"));
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const analysis_schema_1 = require("../schemas/analysis.schema");
const jsonRepair_service_1 = require("./jsonRepair.service");
const openai = env_1.env.OPENAI_API_KEY ? new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY }) : null;
const genAI = env_1.env.GEMINI_API_KEY ? new generative_ai_1.GoogleGenerativeAI(env_1.env.GEMINI_API_KEY) : null;
const GEMINI_MODEL = "gemini-3-flash-preview";
const SYSTEM_PROMPT = `You are a healthcare call analysis assistant.

Your job is to analyze a patient-care coordinator call transcript and return only structured JSON.

Rules:
1. Do not invent facts not present in the transcript.
2. If something is unclear, say "unclear from transcript".
3. Be concise but accurate.
4. Extract only patient-related concerns and actionable coordinator insights.
5. Consider mixed-language or noisy transcripts carefully.
6. If transcript quality is low, reflect uncertainty in the output.
7. Return valid JSON only. No markdown, no explanation, no code fences.`;
const buildUserPrompt = (transcript, language, confidence, qualityFlags) => `Analyze the following patient-care coordinator call transcript.

Transcript:
"""
${transcript}
"""

Transcript metadata:
- language: ${language}
- transcript_confidence: ${confidence !== undefined ? confidence.toFixed(2) : "unknown"}
- quality_flags: ${qualityFlags && qualityFlags.length > 0 ? qualityFlags.join(", ") : "none"}

Return JSON in exactly this structure:

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
  "evidenceLines": {
    "callSummary": ["string"],
    "patientConcerns": ["string"],
    "patientIntent": ["string"],
    "disposition": ["string"],
    "followUpRequired": ["string"],
    "followUpTimeline": ["string"],
    "risksBarriers": ["string"],
    "missedOpportunities": ["string"],
    "recommendedNextAction": ["string"]
  },
  "confidenceScore": 0.0,
  "uncertaintyNotes": ["string"]
}

Additional instructions:
- confidenceScore must be between 0 and 1
- followUpTimeline should be "none" if not applicable
- evidenceLines should quote or paraphrase exact supporting lines from transcript
- if transcript is unreliable, include that in uncertaintyNotes`;
const parseAndValidate = async (rawText) => {
    const cleaned = rawText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
    try {
        const parsed = JSON.parse(cleaned);
        const result = analysis_schema_1.AnalysisSchema.safeParse(parsed);
        if (result.success)
            return result.data;
        logger_1.logger.warn("Zod validation failed", { errors: result.error.errors });
        return null;
    }
    catch {
        logger_1.logger.warn("JSON.parse failed on LLM response");
        return null;
    }
};
const createStatusError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
const getLlmProvider = () => {
    if (env_1.env.LLM_PROVIDER === "auto") {
        return env_1.env.GEMINI_API_KEY ? "gemini" : "openai";
    }
    return env_1.env.LLM_PROVIDER;
};
const buildAnalysisError = (error) => {
    if (error instanceof openai_1.AuthenticationError) {
        return createStatusError("OpenAI authentication failed. Check OPENAI_API_KEY.", 401);
    }
    if (error instanceof openai_1.RateLimitError) {
        return createStatusError("OpenAI quota or rate limit exceeded during analysis. Check billing or retry later.", 429);
    }
    if (error instanceof openai_1.APIConnectionTimeoutError || error instanceof openai_1.APIConnectionError) {
        return createStatusError("Unable to reach OpenAI analysis service. Please retry.", 503);
    }
    if (axios_1.default.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message ||
            error.response?.data?.error?.status ||
            error.message ||
            "Gemini analysis request failed";
        if (status === 401 || status === 403) {
            return createStatusError("Gemini authentication failed. Check GEMINI_API_KEY.", 401);
        }
        if (status === 429) {
            return createStatusError("Gemini quota or rate limit exceeded during analysis.", 429);
        }
        if (status && status >= 500) {
            return createStatusError("Gemini analysis service is temporarily unavailable.", 503);
        }
        return createStatusError(message, status || 502);
    }
    return error instanceof Error ? error : new Error("Unknown analysis error");
};
const generateWithOpenAI = async (prompt) => {
    if (!openai) {
        throw createStatusError("OpenAI analysis is not configured. Set OPENAI_API_KEY.", 500);
    }
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content || "";
};
const generateWithGemini = async (prompt) => {
    if (!genAI) {
        throw createStatusError("Gemini analysis is not configured. Set GEMINI_API_KEY.", 500);
    }
    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        }
    });
    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `${SYSTEM_PROMPT}\n\n${prompt}`,
                    },
                ],
            },
        ],
    });
    const response = await result.response;
    return response.text();
};
const analyzeTranscriptWithLLM = async (payload) => {
    const { transcript, language = "en", confidence, qualityFlags } = payload;
    const provider = getLlmProvider();
    logger_1.logger.info("Starting LLM analysis", { provider });
    const prompt = buildUserPrompt(transcript, language, confidence, qualityFlags);
    let firstRaw = "";
    try {
        firstRaw =
            provider === "gemini" ? await generateWithGemini(prompt) : await generateWithOpenAI(prompt);
    }
    catch (error) {
        throw buildAnalysisError(error);
    }
    const firstResult = await parseAndValidate(firstRaw);
    if (firstResult) {
        logger_1.logger.info("LLM analysis succeeded on first attempt");
        return firstResult;
    }
    logger_1.logger.warn("First LLM attempt invalid; attempting JSON repair");
    const repairedRaw = await (0, jsonRepair_service_1.repairJson)(firstRaw);
    const repairedResult = await parseAndValidate(repairedRaw);
    if (repairedResult) {
        logger_1.logger.info("LLM analysis succeeded after JSON repair");
        return repairedResult;
    }
    logger_1.logger.error("Both LLM attempts failed; returning fallback object");
    return analysis_schema_1.ANALYSIS_FALLBACK;
};
exports.analyzeTranscriptWithLLM = analyzeTranscriptWithLLM;
