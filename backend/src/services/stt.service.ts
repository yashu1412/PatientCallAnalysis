import { DeepgramClient, DeepgramError, DeepgramTimeoutError } from "@deepgram/sdk";
import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  RateLimitError,
} from "openai";
import fs from "fs";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { checkTranscriptQuality } from "../utils/transcriptQuality";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const deepgram = env.DEEPGRAM_API_KEY ? new DeepgramClient({ apiKey: env.DEEPGRAM_API_KEY }) : null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createStatusError = (message: string, statusCode: number): Error & { statusCode?: number } => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

const buildTranscriptionError = (error: unknown): Error & { statusCode?: number } => {
  if (error instanceof AuthenticationError) {
    return createStatusError("OpenAI authentication failed. Check OPENAI_API_KEY.", 401);
  }

  if (error instanceof RateLimitError) {
    return createStatusError(
      "OpenAI rate limit reached while transcribing audio. Please retry in a moment.",
      429
    );
  }

  if (error instanceof APIConnectionTimeoutError || error instanceof APIConnectionError) {
    return createStatusError(
      "Unable to reach OpenAI transcription service. Verify internet access and try again.",
      503
    );
  }

  if (error instanceof DeepgramTimeoutError) {
    return createStatusError(
      "Deepgram transcription timed out. Try a shorter recording or retry in a moment.",
      504
    );
  }

  if (error instanceof DeepgramError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return createStatusError("Deepgram authentication failed. Check DEEPGRAM_API_KEY.", 401);
    }

    if (error.statusCode === 429) {
      return createStatusError(
        "Deepgram rate limit reached while transcribing audio. Please retry in a moment.",
        429
      );
    }

    if (error.statusCode && error.statusCode >= 500) {
      return createStatusError(
        "Deepgram transcription service is temporarily unavailable. Please retry shortly.",
        503
      );
    }

    return createStatusError(error.message, error.statusCode || 502);
  }

  return error instanceof Error ? error : new Error("Unknown transcription error");
};

const requestTranscription = async (filePath: string) => {
  if (!openai) {
    throw createStatusError("OpenAI transcription is not configured. Set OPENAI_API_KEY.", 500);
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const fileStream = fs.createReadStream(filePath);

    try {
      return await openai.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });
    } catch (error) {
      const canRetry =
        error instanceof APIConnectionError ||
        error instanceof APIConnectionTimeoutError ||
        error instanceof RateLimitError;

      if (!canRetry || attempt === maxAttempts) {
        throw buildTranscriptionError(error);
      }

      logger.warn("Retrying OpenAI transcription request", {
        filePath,
        attempt,
        maxAttempts,
        reason: error instanceof Error ? error.message : "Unknown error",
      });

      await delay(attempt * 1000);
    } finally {
      fileStream.destroy();
    }
  }

  throw new Error("Transcription request failed");
};

const requestDeepgramTranscription = async (filePath: string) => {
  if (!deepgram) {
    throw createStatusError("Deepgram is not configured. Set DEEPGRAM_API_KEY.", 500);
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const fileStream = fs.createReadStream(filePath);

    try {
      return await deepgram.listen.v1.media.transcribeFile(
        fileStream,
        {
          model: "nova-3",
          smart_format: true,
          punctuate: true,
          utterances: true,
          diarize: true,
          paragraphs: true,
          detect_language: true,
        },
        {
          timeoutInSeconds: 180,
          maxRetries: 2,
        }
      );
    } catch (error) {
      const canRetry =
        error instanceof DeepgramTimeoutError ||
        (error instanceof DeepgramError &&
          (!error.statusCode || error.statusCode === 429 || error.statusCode >= 500));

      if (!canRetry || attempt === maxAttempts) {
        throw buildTranscriptionError(error);
      }

      logger.warn("Retrying Deepgram transcription request", {
        filePath,
        attempt,
        maxAttempts,
        reason: error instanceof Error ? error.message : "Unknown error",
      });

      await delay(attempt * 1000);
    } finally {
      fileStream.destroy();
    }
  }

  throw new Error("Deepgram transcription request failed");
};

export interface TranscriptResult {
  fullText: string;
  language: string;
  durationSec?: number;
  confidence?: number;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    speaker?: string;
    confidence?: number;
  }>;
  qualityFlags: string[];
  translatedText?: string;
  translatedSegments?: Array<{
    text: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
}

const mapDeepgramResult = (response: Awaited<ReturnType<typeof requestDeepgramTranscription>>): TranscriptResult => {
  const rawResponse = response as any;
  const primaryChannel = rawResponse.results.channels?.[0];
  const primaryAlternative = primaryChannel?.alternatives?.[0];
  const utterances = rawResponse.results.utterances || [];

  const fullText = primaryAlternative?.transcript || "";
  const language = primaryChannel?.detected_language || "en";
  const segments =
    utterances.length > 0
      ? utterances.map((utterance: any) => ({
          text: utterance.transcript || "",
          start: utterance.start || 0,
          end: utterance.end || 0,
          speaker: utterance.speaker !== undefined ? `Speaker ${utterance.speaker + 1}` : undefined,
          confidence: utterance.confidence,
        }))
      : (primaryAlternative?.paragraphs?.paragraphs || []).flatMap((paragraph: any) =>
          (paragraph.sentences || []).map((sentence: any) => ({
            text: sentence.text || "",
            start: sentence.start || paragraph.start || 0,
            end: sentence.end || paragraph.end || 0,
            speaker: paragraph.speaker !== undefined ? `Speaker ${paragraph.speaker + 1}` : undefined,
            confidence: primaryAlternative?.confidence,
          }))
        );

  const confidence = primaryAlternative?.confidence;
  const qualityFlags = checkTranscriptQuality({
    fullText,
    confidence,
    language,
  });

  logger.info("Deepgram transcription complete", {
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
    qualityFlags: qualityFlags as string[],
  };
};

const mapOpenAIResult = (response: Awaited<ReturnType<typeof requestTranscription>>): TranscriptResult => {
  const fullText = response.text || "";
  const language = response.language || "en";

  const rawSegments = (response as any).segments || [];
  const segments = rawSegments.map((seg: any) => ({
    text: seg.text || "",
    start: seg.start || 0,
    end: seg.end || 0,
    confidence: seg.avg_logprob ? Math.min(1, Math.exp(seg.avg_logprob)) : undefined,
  }));

  const logProbs = rawSegments
    .map((s: any) => s.avg_logprob)
    .filter((v: any) => typeof v === "number");
  const avgConfidence =
    logProbs.length > 0
      ? Math.min(1, Math.exp(logProbs.reduce((a: number, b: number) => a + b, 0) / logProbs.length))
      : undefined;

  const qualityFlags = checkTranscriptQuality({
    fullText,
    confidence: avgConfidence,
    language,
  });

  logger.info("Whisper Transcription complete", {
    language,
    wordCount: fullText.split(" ").length,
    qualityFlags,
  });

  return {
    fullText,
    language,
    durationSec: (response as any).duration,
    confidence: avgConfidence,
    segments,
    qualityFlags: qualityFlags as string[],
  };
};

const translateAudioToEnglish = async (
  filePath: string,
  originalSegments: TranscriptResult["segments"]
): Promise<{ translatedText: string; translatedSegments: TranscriptResult["translatedSegments"] }> => {
  if (!openai) {
    logger.warn("OpenAI not configured — skipping translation");
    return { translatedText: "", translatedSegments: [] };
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const createParams: any = {
      file: fileStream,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
      task: "translate",
    };
    const response = await openai.audio.transcriptions.create(createParams);
    fileStream.destroy();

    const translatedText = response.text || "";
    const rawSegs = (response as any).segments || [];

    const translatedSegments = rawSegs.map((seg: any) => {
      const matchingOriginal = originalSegments.find(
        (o) => o.start <= seg.start + 0.5 && o.end >= seg.end - 0.5
      );
      return {
        text: seg.text?.trim() || "",
        start: seg.start || 0,
        end: seg.end || 0,
        speaker: matchingOriginal?.speaker,
      };
    });

    logger.info("Translation complete", { segments: translatedSegments.length });
    return { translatedText, translatedSegments };
  } catch (error) {
    logger.warn("Translation failed — continuing without translation", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
    return { translatedText: "", translatedSegments: [] };
  }
};

export const transcribeAudio = async (filePath: string): Promise<TranscriptResult> => {
  const provider = env.STT_PROVIDER === "auto" ? (deepgram ? "deepgram" : "openai") : env.STT_PROVIDER;

  logger.info("Starting audio transcription", { filePath, provider });

  let result: TranscriptResult;

  if (provider === "deepgram") {
    const response = await requestDeepgramTranscription(filePath);
    result = mapDeepgramResult(response);
  } else {
    const response = await requestTranscription(filePath);
    result = mapOpenAIResult(response);
  }

  const isEnglish = !result.language || result.language.toLowerCase().startsWith("en");
  if (!isEnglish) {
    logger.info("Non-English audio detected — running translation", { language: result.language });
    const { translatedText, translatedSegments } = await translateAudioToEnglish(
      filePath,
      result.segments
    );
    result.translatedText = translatedText;
    result.translatedSegments = translatedSegments;
  }

  return result;
};
