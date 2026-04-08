import { type QualityFlag } from "../utils/transcriptQuality";

interface ConfidenceInput {
  transcriptConfidence?: number;
  qualityFlags: string[];
  analysisUncertaintyNotes?: string[];
  evidenceLines?: Record<string, string[]>;
}

export const computeConfidenceScore = (input: ConfidenceInput): number => {
  const base = input.transcriptConfidence ?? 0.75;
  let penalty = 0;

  const flags = input.qualityFlags as QualityFlag[];

  if (flags.includes("LOW_CONFIDENCE_TRANSCRIPT")) penalty += 0.15;
  if (flags.includes("POSSIBLE_CODE_SWITCHING")) penalty += 0.10;
  if (flags.includes("HIGH_INAUDIBLE_RATE")) penalty += 0.10;
  if (flags.includes("TRANSCRIPT_TOO_SHORT")) penalty += 0.10;
  if (flags.includes("REPEATED_BROKEN_WORDS")) penalty += 0.05;
  if (flags.includes("MISSING_CRITICAL_CONTEXT")) penalty += 0.10;

  const notes = input.analysisUncertaintyNotes || [];
  if (notes.length >= 3) penalty += 0.10;
  else if (notes.length >= 1) penalty += 0.05;

  const evidenceCount = Object.values(input.evidenceLines || {}).flat().length;
  const evidenceBonus = Math.min(0.05, evidenceCount * 0.005);

  const final = Math.max(0, Math.min(1, base - penalty + evidenceBonus));
  return parseFloat(final.toFixed(2));
};
