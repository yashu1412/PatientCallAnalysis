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
exports.transcribeAudio = void 0;
const sdk_1 = require("@deepgram/sdk");
const openai_1 = __importStar(require("openai"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const transcriptQuality_1 = require("../utils/transcriptQuality");
const openai = env_1.env.OPENAI_API_KEY ? new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY }) : null;
const deepgram = env_1.env.DEEPGRAM_API_KEY ? new sdk_1.DeepgramClient({ apiKey: env_1.env.DEEPGRAM_API_KEY }) : null;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const createStatusError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
const buildTranscriptionError = (error) => {
    if (error instanceof openai_1.AuthenticationError) {
        return createStatusError("OpenAI authentication failed. Check OPENAI_API_KEY.", 401);
    }
    if (error instanceof openai_1.RateLimitError) {
        return createStatusError("OpenAI rate limit reached while transcribing audio. Please retry in a moment.", 429);
    }
    if (error instanceof openai_1.APIConnectionTimeoutError || error instanceof openai_1.APIConnectionError) {
        return createStatusError("Unable to reach OpenAI transcription service. Verify internet access and try again.", 503);
    }
    if (error instanceof sdk_1.DeepgramTimeoutError) {
        return createStatusError("Deepgram transcription timed out. Try a shorter recording or retry in a moment.", 504);
    }
    if (error instanceof sdk_1.DeepgramError) {
        if (error.statusCode === 401 || error.statusCode === 403) {
            return createStatusError("Deepgram authentication failed. Check DEEPGRAM_API_KEY.", 401);
        }
        if (error.statusCode === 429) {
            return createStatusError("Deepgram rate limit reached while transcribing audio. Please retry in a moment.", 429);
        }
        if (error.statusCode && error.statusCode >= 500) {
            return createStatusError("Deepgram transcription service is temporarily unavailable. Please retry shortly.", 503);
        }
        return createStatusError(error.message, error.statusCode || 502);
    }
    return error instanceof Error ? error : new Error("Unknown transcription error");
};
const requestTranscription = async (filePath) => {
    if (!openai) {
        throw createStatusError("OpenAI transcription is not configured. Set OPENAI_API_KEY.", 500);
    }
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const fileStream = fs_1.default.createReadStream(filePath);
        try {
            return await openai.audio.transcriptions.create({
                file: fileStream,
                model: "whisper-1",
                response_format: "verbose_json",
                timestamp_granularities: ["segment"],
            });
        }
        catch (error) {
            const canRetry = error instanceof openai_1.APIConnectionError ||
                error instanceof openai_1.APIConnectionTimeoutError ||
                error instanceof openai_1.RateLimitError;
            if (!canRetry || attempt === maxAttempts) {
                throw buildTranscriptionError(error);
            }
            logger_1.logger.warn("Retrying OpenAI transcription request", {
                filePath,
                attempt,
                maxAttempts,
                reason: error instanceof Error ? error.message : "Unknown error",
            });
            await delay(attempt * 1000);
        }
        finally {
            fileStream.destroy();
        }
    }
    throw new Error("Transcription request failed");
};
const requestDeepgramTranscription = async (filePath) => {
    if (!deepgram) {
        throw createStatusError("Deepgram is not configured. Set DEEPGRAM_API_KEY.", 500);
    }
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const fileStream = fs_1.default.createReadStream(filePath);
        try {
            return await deepgram.listen.v1.media.transcribeFile(fileStream, {
                model: "nova-3",
                smart_format: true,
                punctuate: true,
                utterances: true,
                diarize: true,
                paragraphs: true,
                detect_language: true,
            }, {
                timeoutInSeconds: 180,
                maxRetries: 2,
            });
        }
        catch (error) {
            const canRetry = error instanceof sdk_1.DeepgramTimeoutError ||
                (error instanceof sdk_1.DeepgramError &&
                    (!error.statusCode || error.statusCode === 429 || error.statusCode >= 500));
            if (!canRetry || attempt === maxAttempts) {
                throw buildTranscriptionError(error);
            }
            logger_1.logger.warn("Retrying Deepgram transcription request", {
                filePath,
                attempt,
                maxAttempts,
                reason: error instanceof Error ? error.message : "Unknown error",
            });
            await delay(attempt * 1000);
        }
        finally {
            fileStream.destroy();
        }
    }
    throw new Error("Deepgram transcription request failed");
};
const mapDeepgramResult = (response) => {
    const rawResponse = response;
    const primaryChannel = rawResponse.results.channels?.[0];
    const primaryAlternative = primaryChannel?.alternatives?.[0];
    const utterances = rawResponse.results.utterances || [];
    const fullText = primaryAlternative?.transcript || "";
    const language = primaryChannel?.detected_language || "en";
    const segments = utterances.length > 0
        ? utterances.map((utterance) => ({
            text: utterance.transcript || "",
            start: utterance.start || 0,
            end: utterance.end || 0,
            speaker: utterance.speaker !== undefined ? `Speaker ${utterance.speaker + 1}` : undefined,
            confidence: utterance.confidence,
        }))
        : (primaryAlternative?.paragraphs?.paragraphs || []).flatMap((paragraph) => (paragraph.sentences || []).map((sentence) => ({
            text: sentence.text || "",
            start: sentence.start || paragraph.start || 0,
            end: sentence.end || paragraph.end || 0,
            speaker: paragraph.speaker !== undefined ? `Speaker ${paragraph.speaker + 1}` : undefined,
            confidence: primaryAlternative?.confidence,
        })));
    const confidence = primaryAlternative?.confidence;
    const qualityFlags = (0, transcriptQuality_1.checkTranscriptQuality)({
        fullText,
        confidence,
        language,
    });
    logger_1.logger.info("Deepgram transcription complete", {
        language,
        wordCount: fullText.split(" ").length,
        qualityFlags,
    });
    return {
        fullText,
        language,
        durationSec: rawResponse.metadata.duration,
        confidence,
        segments,
        qualityFlags: qualityFlags,
    };
};
const mapOpenAIResult = (response) => {
    const fullText = response.text || "";
    const language = response.language || "en";
    const rawSegments = response.segments || [];
    const segments = rawSegments.map((seg) => ({
        text: seg.text || "",
        start: seg.start || 0,
        end: seg.end || 0,
        confidence: seg.avg_logprob ? Math.min(1, Math.exp(seg.avg_logprob)) : undefined,
    }));
    const logProbs = rawSegments
        .map((s) => s.avg_logprob)
        .filter((v) => typeof v === "number");
    const avgConfidence = logProbs.length > 0
        ? Math.min(1, Math.exp(logProbs.reduce((a, b) => a + b, 0) / logProbs.length))
        : undefined;
    const qualityFlags = (0, transcriptQuality_1.checkTranscriptQuality)({
        fullText,
        confidence: avgConfidence,
        language,
    });
    logger_1.logger.info("Whisper Transcription complete", {
        language,
        wordCount: fullText.split(" ").length,
        qualityFlags,
    });
    return {
        fullText,
        language,
        durationSec: response.duration,
        confidence: avgConfidence,
        segments,
        qualityFlags: qualityFlags,
    };
};
const transcribeAudio = async (filePath) => {
    const provider = env_1.env.STT_PROVIDER === "auto" ? (deepgram ? "deepgram" : "openai") : env_1.env.STT_PROVIDER;
    logger_1.logger.info("Starting audio transcription", { filePath, provider });
    if (provider === "deepgram") {
        const response = await requestDeepgramTranscription(filePath);
        return mapDeepgramResult(response);
    }
    const response = await requestTranscription(filePath);
    return mapOpenAIResult(response);
};
exports.transcribeAudio = transcribeAudio;
