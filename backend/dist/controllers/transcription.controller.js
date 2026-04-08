"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeCall = void 0;
const CallRecord_model_1 = __importDefault(require("../models/CallRecord.model"));
const stt_service_1 = require("../services/stt.service");
const logger_1 = require("../utils/logger");
const transcribeCall = async (req, res, next) => {
    try {
        const record = await CallRecord_model_1.default.findById(req.params.id);
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
        logger_1.logger.info("Transcribing call", { callId: record._id });
        const result = await (0, stt_service_1.transcribeAudio)(record.fileUrl);
        record.transcript = {
            fullText: result.fullText,
            language: result.language,
            durationSec: result.durationSec,
            confidence: result.confidence,
            segments: result.segments,
            qualityFlags: result.qualityFlags,
        };
        record.status = "transcribed";
        await record.save();
        res.json({
            success: true,
            callId: record._id,
            status: record.status,
            transcript: record.transcript,
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
exports.transcribeCall = transcribeCall;
