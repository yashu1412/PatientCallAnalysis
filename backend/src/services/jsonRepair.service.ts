import axios from "axios";
import OpenAI from "openai";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const GEMINI_MODEL = "gemini-1.5-flash";

export const repairJson = async (brokenJson: string): Promise<string> => {
  logger.info("Attempting JSON repair via LLM");

  const systemPrompt =
    "You are a JSON repair assistant. Fix the following malformed JSON and return ONLY valid JSON. No explanation, no markdown.";
  const userPrompt = `Repair this JSON:\n\n${brokenJson}`;
  const provider = env.LLM_PROVIDER === "auto" ? (env.GEMINI_API_KEY ? "gemini" : "openai") : env.LLM_PROVIDER;

  if (provider === "gemini") {
    if (!env.GEMINI_API_KEY) {
      throw new Error("Gemini JSON repair is not configured. Set GEMINI_API_KEY.");
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      },
      {
        params: { key: env.GEMINI_API_KEY },
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    return (
      response.data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("").trim() ||
      "{}"
    );
  }

  if (!openai) {
    throw new Error("OpenAI JSON repair is not configured. Set OPENAI_API_KEY.");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content || "{}";
};
