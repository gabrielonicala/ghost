interface ContentStructure {
  hookType?: string;
  visualComposition?: string;
  audioTrend?: string;
  duration?: number;
}

interface FatigueInputs {
  contentItem: {
    id: string;
    structure: ContentStructure;
  };
  similarContent: Array<{
    id: string;
    structure: ContentStructure;
    similarity: number;
  }>;
  brandHistory?: Array<{
    contentId: string;
    structure: ContentStructure;
  }>;
  industryTrends?: Array<{
    format: string;
    frequency: number;
  }>;
}

/**
 * Detects UGC fatigue and creative exhaustion
 */
export async function calculateFatigueRisk(
  inputs: FatigueInputs
): Promise<{
  fatigueRiskScore: number;
  creativeOriginalityPercentile: number;
  overusedFormatWarnings: string[];
  breakdown: {
    structuralSimilarity: number;
    hookPatternReuseFreq: number;
    visualCompositionOverlap: number;
    audioTrendSaturation: number;
    brandLevelRepetition: number;
    industryLevelExhaustion: number;
  };
}> {
  let fatigueRiskScore = 0; // Start low (good)
  const warnings: string[] = [];
  const breakdown: any = {};

  // 1. Structural Similarity
  let structuralSimilarity = 0;
  if (inputs.similarContent.length > 0) {
    structuralSimilarity =
      inputs.similarContent.reduce((sum, item) => sum + item.similarity, 0) /
      inputs.similarContent.length;
    if (structuralSimilarity > 0.8) {
      fatigueRiskScore += 30;
      warnings.push("Very similar structure to recent content");
    } else if (structuralSimilarity > 0.6) {
      fatigueRiskScore += 15;
      warnings.push("Similar structure detected");
    }
  }
  breakdown.structuralSimilarity = structuralSimilarity;

  // 2. Hook Pattern Reuse
  let hookPatternReuseFreq = 0;
  if (inputs.contentItem.structure.hookType) {
    const sameHookCount = inputs.similarContent.filter(
      (item) =>
        item.structure.hookType === inputs.contentItem.structure.hookType
    ).length;
    hookPatternReuseFreq = sameHookCount / Math.max(inputs.similarContent.length, 1);
    if (hookPatternReuseFreq > 0.5) {
      fatigueRiskScore += 20;
      warnings.push("Overused hook pattern");
    }
  }
  breakdown.hookPatternReuseFreq = hookPatternReuseFreq;

  // 3. Visual Composition Overlap
  let visualCompositionOverlap = 0;
  if (inputs.contentItem.structure.visualComposition) {
    const sameCompositionCount = inputs.similarContent.filter(
      (item) =>
        item.structure.visualComposition ===
        inputs.contentItem.structure.visualComposition
    ).length;
    visualCompositionOverlap =
      sameCompositionCount / Math.max(inputs.similarContent.length, 1);
    if (visualCompositionOverlap > 0.6) {
      fatigueRiskScore += 15;
      warnings.push("Repetitive visual composition");
    }
  }
  breakdown.visualCompositionOverlap = visualCompositionOverlap;

  // 4. Audio Trend Saturation
  let audioTrendSaturation = 0;
  if (inputs.contentItem.structure.audioTrend) {
    const sameAudioCount = inputs.similarContent.filter(
      (item) =>
        item.structure.audioTrend === inputs.contentItem.structure.audioTrend
    ).length;
    audioTrendSaturation =
      sameAudioCount / Math.max(inputs.similarContent.length, 1);
    if (audioTrendSaturation > 0.7) {
      fatigueRiskScore += 10;
      warnings.push("Overused audio trend");
    }
  }
  breakdown.audioTrendSaturation = audioTrendSaturation;

  // 5. Brand-Level Repetition
  let brandLevelRepetition = 0;
  if (inputs.brandHistory && inputs.brandHistory.length > 0) {
    const sameStructureCount = inputs.brandHistory.filter(
      (item) =>
        item.structure.hookType === inputs.contentItem.structure.hookType &&
        item.structure.visualComposition ===
          inputs.contentItem.structure.visualComposition
    ).length;
    brandLevelRepetition =
      sameStructureCount / Math.max(inputs.brandHistory.length, 1);
    if (brandLevelRepetition > 0.5) {
      fatigueRiskScore += 25;
      warnings.push("Repetitive format for this brand");
    }
  }
  breakdown.brandLevelRepetition = brandLevelRepetition;

  // 6. Industry-Level Exhaustion
  let industryLevelExhaustion = 0;
  if (inputs.industryTrends) {
    const currentFormat = `${inputs.contentItem.structure.hookType}_${inputs.contentItem.structure.visualComposition}`;
    const trend = inputs.industryTrends.find((t) => t.format === currentFormat);
    if (trend && trend.frequency > 1000) {
      industryLevelExhaustion = Math.min(1, trend.frequency / 10000);
      if (industryLevelExhaustion > 0.7) {
        fatigueRiskScore += 15;
        warnings.push("Industry-wide format saturation");
      }
    }
  }
  breakdown.industryLevelExhaustion = industryLevelExhaustion;

  // Normalize to 0-100
  fatigueRiskScore = Math.max(0, Math.min(100, fatigueRiskScore));

  // Calculate originality percentile (inverse of fatigue)
  const creativeOriginalityPercentile = Math.max(
    0,
    Math.min(100, 100 - fatigueRiskScore)
  );

  return {
    fatigueRiskScore,
    creativeOriginalityPercentile,
    overusedFormatWarnings: warnings,
    breakdown,
  };
}

