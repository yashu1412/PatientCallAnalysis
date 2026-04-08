import { z } from "zod";

export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  usageCause: z.string(),
  ageLimit: z.string().optional(),
});

export const AnalysisSchema = z.object({
  callSummary: z.string(),
  patientConcerns: z.array(z.string()),
  patientIntent: z.string(),
  disposition: z.string(),
  followUpRequired: z.boolean(),
  followUpTimeline: z.string(),
  risksBarriers: z.array(z.string()),
  missedOpportunities: z.array(z.string()),
  recommendedNextAction: z.string(),
  evidenceLines: z.record(z.array(z.string())).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  uncertaintyNotes: z.array(z.string()).optional(),
  medications: z.array(MedicationSchema).optional(),
});

export type AnalysisOutput = z.infer<typeof AnalysisSchema>;

export const ANALYSIS_FALLBACK: AnalysisOutput = {
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
  medications: [],
};
