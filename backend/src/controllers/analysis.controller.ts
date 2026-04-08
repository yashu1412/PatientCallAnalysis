import { Request, Response, NextFunction } from "express";
import CallRecord from "../models/CallRecord.model";
import { analyzeTranscriptWithLLM } from "../services/llm.service";
import { computeConfidenceScore } from "../services/confidence.service";
import { logger } from "../utils/logger";

export const analyzeTranscript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await CallRecord.findById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, error: "Call record not found" });
      return;
    }

    logger.info("Analyzing content with LLM", { callId: record._id, type: record.type });

    const analysisRaw = await analyzeTranscriptWithLLM({
      transcript: record.type === "call" ? record.transcript.fullText : "Analyze prescription from image",
      type: record.type,
      imagePath: record.type === "prescription" ? record.fileUrl : undefined,
      language: record.transcript.language,
      confidence: record.transcript.confidence,
      qualityFlags: record.transcript.qualityFlags as string[],
    });

    const computedScore = computeConfidenceScore({
      transcriptConfidence: record.transcript.confidence,
      qualityFlags: record.transcript.qualityFlags || [],
      analysisUncertaintyNotes: analysisRaw.uncertaintyNotes,
      evidenceLines: analysisRaw.evidenceLines,
    });

    const analysis = {
      ...analysisRaw,
      confidenceScore: computedScore,
    };

    record.analysis = analysis;
    record.status = "analyzed";
    await record.save();

    res.json({
      success: true,
      callId: record._id,
      status: record.status,
      analysis: record.analysis,
    });
  } catch (err) {
    try {
      await CallRecord.findByIdAndUpdate(req.params.id, { status: "failed" });
    } catch {}
    next(err);
  }
};
