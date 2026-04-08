"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTranscript = void 0;
const CallRecord_model_1 = __importDefault(require("../models/CallRecord.model"));
const llm_service_1 = require("../services/llm.service");
const confidence_service_1 = require("../services/confidence.service");
const logger_1 = require("../utils/logger");
const analyzeTranscript = async (req, res, next) => {
    try {
        const record = await CallRecord_model_1.default.findById(req.params.id);
        if (!record) {
            res.status(404).json({ success: false, error: "Call record not found" });
            return;
        }
        if (!record.transcript?.fullText) {
            res.status(400).json({
                success: false,
                error: "Transcript not available. Transcribe the call first.",
            });
            return;
        }
        if (record.status === "analyzed") {
            res.json({
                success: true,
                callId: record._id,
                status: record.status,
                analysis: record.analysis,
            });
            return;
        }
        logger_1.logger.info("Analyzing transcript with LLM", { callId: record._id });
        const analysisRaw = await (0, llm_service_1.analyzeTranscriptWithLLM)({
            transcript: record.transcript.fullText,
            language: record.transcript.language,
            confidence: record.transcript.confidence,
            qualityFlags: record.transcript.qualityFlags,
        });
        const computedScore = (0, confidence_service_1.computeConfidenceScore)({
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
    }
    catch (err) {
        try {
            await CallRecord_model_1.default.findByIdAndUpdate(req.params.id, { status: "failed" });
        }
        catch { }
        next(err);
    }
};
exports.analyzeTranscript = analyzeTranscript;
