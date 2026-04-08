"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairJson = void 0;
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const openai = env_1.env.OPENAI_API_KEY ? new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY }) : null;
const GEMINI_MODEL = "gemini-1.5-flash";
const repairJson = async (brokenJson) => {
    logger_1.logger.info("Attempting JSON repair via LLM");
    const systemPrompt = "You are a JSON repair assistant. Fix the following malformed JSON and return ONLY valid JSON. No explanation, no markdown.";
    const userPrompt = `Repair this JSON:\n\n${brokenJson}`;
    const provider = env_1.env.LLM_PROVIDER === "auto" ? (env_1.env.GEMINI_API_KEY ? "gemini" : "openai") : env_1.env.LLM_PROVIDER;
    if (provider === "gemini") {
        if (!env_1.env.GEMINI_API_KEY) {
            throw new Error("Gemini JSON repair is not configured. Set GEMINI_API_KEY.");
        }
        const response = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
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
        }, {
            params: { key: env_1.env.GEMINI_API_KEY },
            headers: { "Content-Type": "application/json" },
            timeout: 60000,
        });
        return (response.data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() ||
            "{}");
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
exports.repairJson = repairJson;
