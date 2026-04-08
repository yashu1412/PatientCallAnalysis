import { Request, Response, NextFunction } from "express";
import CallRecord from "../models/CallRecord.model";
import { transcribeAudio } from "../services/stt.service";
import { logger } from "../utils/logger";

export const transcribeCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await CallRecord.findById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, error: "Call record not found" });
      return;
    }

    if (!record.fileUrl) {
      res.status(400).json({ success: false, error: "No audio file path stored for this record" });
      return;
    }

    if (record.status === "transcribed" || record.status === "analyzed") {
      res.json({
        success: true,
        callId: record._id,
        status: record.status,
        transcript: record.transcript,
      });
      return;
    }

    logger.info("Transcribing call", { callId: record._id });

    const result = await transcribeAudio(record.fileUrl);

    record.transcript = {
      fullText: result.fullText,
      language: result.language,
      durationSec: result.durationSec,
      confidence: result.confidence,
      segments: result.segments,
      qualityFlags: result.qualityFlags,
      translatedText: result.translatedText,
      translatedSegments: result.translatedSegments,
    };
    record.status = "transcribed";
    await record.save();

    res.json({
      success: true,
      callId: record._id,
      status: record.status,
      transcript: record.transcript,
    });
  } catch (err) {
    try {
      await CallRecord.findByIdAndUpdate(req.params.id, { status: "failed" });
    } catch {}
    next(err);
  }
};
