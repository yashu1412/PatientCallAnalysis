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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CallRecordSchema = new mongoose_1.Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String },
    mimeType: { type: String, required: true },
    fileSize: { type: Number },
    status: {
        type: String,
        enum: ["uploaded", "transcribed", "analyzed", "failed"],
        default: "uploaded",
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
        evidenceLines: { type: mongoose_1.Schema.Types.Mixed },
        confidenceScore: Number,
        uncertaintyNotes: [String],
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("CallRecord", CallRecordSchema);
