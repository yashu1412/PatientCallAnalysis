import { Request, Response, NextFunction } from "express";
import CallRecord from "../models/CallRecord.model";
import { logger } from "../utils/logger";

export const uploadCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No audio file uploaded" });
      return;
    }

    const isImage = req.file.mimetype.startsWith("image/");

    const record = await CallRecord.create({
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: "uploaded",
      type: isImage ? "prescription" : "call",
    });

    logger.info("Call record created", { callId: record._id, fileName: record.fileName });

    res.status(201).json({
      success: true,
      callId: record._id,
      fileName: record.fileName,
      status: record.status,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllCalls = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      CallRecord.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("fileName status mimeType fileSize createdAt updatedAt type"),
      CallRecord.countDocuments(),
    ]);

    res.json({
      success: true,
      data: calls,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getCallById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await CallRecord.findById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, error: "Call record not found" });
      return;
    }

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};
