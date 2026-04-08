import mongoose, { Schema, Document } from "mongoose";

export interface ICallRecord extends Document {
  fileName: string;
  fileUrl?: string;
  mimeType: string;
  fileSize?: number;
  status: "uploaded" | "transcribed" | "analyzed" | "failed";
  type: "call" | "prescription";

  transcript: {
    fullText: string;
    language?: string;
    durationSec?: number;
    confidence?: number;
    segments?: {
      text: string;
      start: number;
      end: number;
      speaker?: string;
      confidence?: number;
    }[];
    qualityFlags?: string[];
    translatedText?: string;
    translatedSegments?: {
      text: string;
      start: number;
      end: number;
      speaker?: string;
    }[];
  };

  analysis: {
    callSummary: string;
    patientConcerns: string[];
    patientIntent: string;
    disposition: string;
    followUpRequired: boolean;
    followUpTimeline?: string;
    risksBarriers: string[];
    missedOpportunities: string[];
    recommendedNextAction: string;
    evidenceLines?: Record<string, string[]>;
    confidenceScore?: number;
    uncertaintyNotes?: string[];
    medications?: {
      name: string;
      dosage: string;
      frequency: string;
      usageCause: string;
      ageLimit?: string;
    }[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const CallRecordSchema = new Schema<ICallRecord>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String },
    mimeType: { type: String, required: true },
    fileSize: { type: Number },
    status: {
      type: String,
      enum: ["uploaded", "transcribed", "analyzed", "failed"],
      default: "uploaded",
    },
    type: {
      type: String,
      enum: ["call", "prescription"],
      default: "call",
    },
    transcript: {
      fullText: { type: String, default: "" },
      language: String,
      durationSec: Number,
      confidence: Number,
      segments: [
        {
          text: String,
          start: Number,
          end: Number,
          speaker: String,
          confidence: Number,
        },
      ],
      qualityFlags: [String],
      translatedText: String,
      translatedSegments: [
        {
          text: String,
          start: Number,
          end: Number,
          speaker: String,
        },
      ],
    },
    analysis: {
      callSummary: String,
      patientConcerns: [String],
      patientIntent: String,
      disposition: String,
      followUpRequired: Boolean,
      followUpTimeline: String,
      risksBarriers: [String],
      missedOpportunities: [String],
      recommendedNextAction: String,
      evidenceLines: { type: Schema.Types.Mixed },
      confidenceScore: Number,
      uncertaintyNotes: [String],
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          usageCause: String,
          ageLimit: String,
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICallRecord>("CallRecord", CallRecordSchema);
