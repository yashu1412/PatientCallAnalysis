"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTranscriptQuality = void 0;
const checkTranscriptQuality = (transcript) => {
    const flags = [];
    const text = transcript.fullText || "";
    if (text.trim().split(/\s+/).length < 20) {
        flags.push("TRANSCRIPT_TOO_SHORT");
    }
    if (transcript.confidence !== undefined && transcript.confidence < 0.70) {
        flags.push("LOW_CONFIDENCE_TRANSCRIPT");
    }
    const inaudibleMatches = text.match(/\[inaudible\]/gi) || [];
    const wordCount = text.split(/\s+/).length;
    if (inaudibleMatches.length / wordCount > 0.05) {
        flags.push("HIGH_INAUDIBLE_RATE");
    }
    const repetitionPattern = /\b(\w+)\s+\1\s+\1\b/gi;
    if (repetitionPattern.test(text)) {
        flags.push("REPEATED_BROKEN_WORDS");
    }
    const hinglishPatterns = /\b(kya|nahi|haan|acha|theek|matlab|bolo|bata|abhi|phir|toh|yeh|woh|mai|mera|tumhara)\b/gi;
    if (hinglishPatterns.test(text)) {
        flags.push("POSSIBLE_CODE_SWITCHING");
    }
    const medicalTerms = /\b(doctor|patient|medication|prescription|symptoms|appointment|follow.?up|diagnosis|treatment|hospital|clinic)\b/gi;
    if (!medicalTerms.test(text)) {
        flags.push("MISSING_CRITICAL_CONTEXT");
    }
    return flags;
};
exports.checkTranscriptQuality = checkTranscriptQuality;
