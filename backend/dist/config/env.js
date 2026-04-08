"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requireEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};
exports.env = {
    PORT: parseInt(process.env.PORT || "5000", 10),
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/patientcallanalysis",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    STT_PROVIDER: (process.env.STT_PROVIDER || "auto"),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    LLM_PROVIDER: (process.env.LLM_PROVIDER || "auto"),
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};
