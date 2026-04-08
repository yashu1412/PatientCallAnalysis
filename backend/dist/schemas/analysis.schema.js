"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_FALLBACK = exports.AnalysisSchema = void 0;
const zod_1 = require("zod");
exports.AnalysisSchema = zod_1.z.object({
    callSummary: zod_1.z.string(),
    patientConcerns: zod_1.z.array(zod_1.z.string()),
    patientIntent: zod_1.z.string(),
    disposition: zod_1.z.string(),
    followUpRequired: zod_1.z.boolean(),
    followUpTimeline: zod_1.z.string(),
    risksBarriers: zod_1.z.array(zod_1.z.string()),
    missedOpportunities: zod_1.z.array(zod_1.z.string()),
    recommendedNextAction: zod_1.z.string(),
    evidenceLines: zod_1.z.record(zod_1.z.array(zod_1.z.string())).optional(),
    confidenceScore: zod_1.z.number().min(0).max(1).optional(),
    uncertaintyNotes: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.ANALYSIS_FALLBACK = {
    callSummary: "Analysis could not be fully generated due to invalid model output.",
    patientConcerns: [],
    patientIntent: "unclear from transcript",
    disposition: "manual review required",
    followUpRequired: false,
    followUpTimeline: "none",
    risksBarriers: ["Model output validation failed"],
    missedOpportunities: [],
    recommendedNextAction: "Review transcript manually",
    uncertaintyNotes: ["LLM returned invalid JSON after retry"],
};
