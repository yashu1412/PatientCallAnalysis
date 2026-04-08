import dotenv from "dotenv";
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/patientcallanalysis",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
  STT_PROVIDER: (process.env.STT_PROVIDER || "auto") as "auto" | "deepgram" | "openai",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  LLM_PROVIDER: (process.env.LLM_PROVIDER || "auto") as "auto" | "gemini" | "openai",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};
