import type { ACCSScore } from "@/lib/types";

interface TranscriptAnalysis {
  text: string;
  entropy: number;
  phraseReuse: number;
  naturalPacing: number;
}

interface AuthenticityInputs {
  transcript?: string;
  caption?: string;
  creatorHistory?: {
    previousPromotions: string[];
    scriptPatterns: string[];
  };
  brandMentionTiming?: number; // 0-1, where 1 = mentioned early naturally
  hookText?: string;
  visualContinuity?: number; // 0-1
}

/**
 * Calculates authenticity score based on multiple signals
 */
export async function calculateAuthenticityScore(
  inputs: AuthenticityInputs
): Promise<{
  score: number;
  scriptLikelihood: number;
  reusedHookDetected: boolean;
  reasons: string[];
  breakdown: {
    transcriptEntropy: number;
    phraseReuseCount: number;
    naturalPacingScore: number;
    brandMentionTiming: number;
    hookOriginality: number;
    visualContinuity: number;
  };
}> {
  const reasons: string[] = [];
  let score = 50; // Start neutral

  // 1. Transcript Entropy Analysis
  let transcriptEntropy = 0.5;
  if (inputs.transcript) {
    transcriptEntropy = calculateEntropy(inputs.transcript);
    if (transcriptEntropy > 0.7) {
      score += 15;
      reasons.push("Natural speech patterns detected");
    } else if (transcriptEntropy < 0.3) {
      score -= 20;
      reasons.push("Scripted or templated speech detected");
    }
  }

  // 2. Phrase Reuse Detection
  let phraseReuseCount = 0;
  let reusedHookDetected = false;
  if (inputs.creatorHistory?.previousPromotions) {
    phraseReuseCount = detectPhraseReuse(
      inputs.transcript || inputs.caption || "",
      inputs.creatorHistory.previousPromotions
    );
    if (phraseReuseCount > 3) {
      score -= 15;
      reusedHookDetected = true;
      reasons.push("Repeated promotional phrases detected");
    }
  }

  // 3. Hook Originality
  let hookOriginality = 0.5;
  if (inputs.hookText) {
    hookOriginality = analyzeHookOriginality(
      inputs.hookText,
      inputs.creatorHistory?.previousPromotions || []
    );
    if (hookOriginality > 0.7) {
      score += 10;
      reasons.push("Original hook detected");
    } else if (hookOriginality < 0.3) {
      score -= 10;
      reasons.push("Generic or reused hook pattern");
    }
  }

  // 4. Brand Mention Timing
  let brandMentionTiming = inputs.brandMentionTiming || 0.5;
  if (brandMentionTiming > 0.7) {
    score += 10;
    reasons.push("Natural brand integration");
  } else if (brandMentionTiming < 0.3) {
    score -= 15;
    reasons.push("Forced or late brand mention");
  }

  // 5. Natural Pacing
  let naturalPacingScore = inputs.creatorHistory
    ? analyzePacing(inputs.transcript || "")
    : 0.5;
  if (naturalPacingScore > 0.7) {
    score += 8;
    reasons.push("Natural pacing and flow");
  } else if (naturalPacingScore < 0.3) {
    score -= 8;
    reasons.push("Unnatural pacing detected");
  }

  // 6. Visual Continuity
  let visualContinuity = inputs.visualContinuity || 0.5;
  if (visualContinuity > 0.7) {
    score += 7;
    reasons.push("Natural product interaction");
  } else if (visualContinuity < 0.3) {
    score -= 7;
    reasons.push("Staged or unnatural product placement");
  }

  // Calculate script likelihood (inverse of authenticity)
  const scriptLikelihood = Math.max(0, Math.min(100, 100 - score));

  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    scriptLikelihood,
    reusedHookDetected,
    reasons,
    breakdown: {
      transcriptEntropy,
      phraseReuseCount,
      naturalPacingScore,
      brandMentionTiming,
      hookOriginality,
      visualContinuity,
    },
  };
}

/**
 * Calculate Shannon entropy of text (measure of randomness/naturalness)
 */
function calculateEntropy(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  let totalWords = 0;

  words.forEach((word) => {
    if (word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
      totalWords++;
    }
  });

  if (totalWords === 0) return 0;

  let entropy = 0;
  Object.values(wordFreq).forEach((freq) => {
    const probability = freq / totalWords;
    entropy -= probability * Math.log2(probability);
  });

  // Normalize to 0-1 (max entropy for English is ~4.7 bits per word)
  return Math.min(1, entropy / 4.7);
}

/**
 * Detect phrase reuse across promotions
 */
function detectPhraseReuse(
  currentText: string,
  previousPromotions: string[]
): number {
  const currentWords = currentText.toLowerCase().split(/\s+/);
  let reuseCount = 0;

  previousPromotions.forEach((promo) => {
    const promoWords = promo.toLowerCase().split(/\s+/);
    // Check for 3+ word phrase matches
    for (let i = 0; i <= currentWords.length - 3; i++) {
      const phrase = currentWords.slice(i, i + 3).join(" ");
      if (promoWords.join(" ").includes(phrase)) {
        reuseCount++;
        break;
      }
    }
  });

  return reuseCount;
}

/**
 * Analyze hook originality
 */
function analyzeHookOriginality(
  hookText: string,
  previousPromotions: string[]
): number {
  if (previousPromotions.length === 0) return 1.0;

  const hookWords = hookText.toLowerCase().split(/\s+/);
  let similaritySum = 0;

  previousPromotions.forEach((promo) => {
    const promoWords = promo.toLowerCase().split(/\s+/);
    const commonWords = hookWords.filter((w) => promoWords.includes(w));
    similaritySum += commonWords.length / Math.max(hookWords.length, 1);
  });

  const avgSimilarity = similaritySum / previousPromotions.length;
  return 1 - avgSimilarity; // Originality = 1 - similarity
}

/**
 * Analyze natural pacing (simplified - would use audio analysis in production)
 */
function analyzePacing(transcript: string): number {
  // Simple heuristic: check for natural pauses, sentence length variation
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length < 2) return 0.5;

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
    lengths.length;

  // Higher variance = more natural pacing
  return Math.min(1, variance / 100);
}

