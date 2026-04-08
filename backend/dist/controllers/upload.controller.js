"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCallById = exports.getAllCalls = exports.uploadCall = void 0;
const CallRecord_model_1 = __importDefault(require("../models/CallRecord.model"));
const logger_1 = require("../utils/logger");
const uploadCall = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: "No audio file uploaded" });
            return;
        }
        const record = await CallRecord_model_1.default.create({
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            status: "uploaded",
        });
        logger_1.logger.info("Call record created", { callId: record._id, fileName: record.fileName });
        res.status(201).json({
            success: true,
            callId: record._id,
            fileName: record.fileName,
            status: record.status,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.uploadCall = uploadCall;
const getAllCalls = async (_req, res, next) => {
    try {
        const calls = await CallRecord_model_1.default.find()
            .sort({ createdAt: -1 })
            .select("fileName status mimeType fileSize createdAt updatedAt");
        res.json({ success: true, data: calls });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllCalls = getAllCalls;
const getCallById = async (req, res, next) => {
    try {
        const record = await CallRecord_model_1.default.findById(req.params.id);
        if (!record) {
            res.status(404).json({ success: false, error: "Call record not found" });
            return;
        }
        res.json({ success: true, data: record });
    }
    catch (err) {
        next(err);
    }
};
exports.getCallById = getCallById;
