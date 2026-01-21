import type { ACCSScore, PerformanceTier, RecommendedUse } from "@/lib/types";
import { calculateAuthenticityScore } from "./authenticity";
import { calculateAudienceTrustScore } from "./audience-trust";
import { calculatePromotionSaturation } from "./promotion-saturation";
import { calculateFatigueRisk } from "./fatigue";

interface ACCSInputs {
  contentItemId: string;
  transcript?: string;
  caption?: string;
  engagementMetrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    views?: number;
    commentTexts?: string[];
  };
  creatorHistory?: {
    previousPromotions: string[];
    scriptPatterns: string[];
    promotionalPosts: Array<{
      date: Date;
      brandName?: string;
      category?: string;
    }>;
  };
  similarContent?: Array<{
    id: string;
    structure: {
      hookType?: string;
      visualComposition?: string;
      audioTrend?: string;
    };
    similarity: number;
  }>;
  brandHistory?: Array<{
    contentId: string;
    structure: {
      hookType?: string;
      visualComposition?: string;
    };
  }>;
  brandMentionTiming?: number;
  hookText?: string;
  visualContinuity?: number;
  contentStructure?: {
    hookType?: string;
    visualComposition?: string;
    audioTrend?: string;
    duration?: number;
  };
}

/**
 * Main ACCS scoring function - synthesizes all dimensions
 */
export async function calculateACCS(inputs: ACCSInputs): Promise<ACCSScore> {
  // 1. Calculate Authenticity Score
  const authenticity = await calculateAuthenticityScore({
    transcript: inputs.transcript,
    caption: inputs.caption,
    creatorHistory: inputs.creatorHistory,
    brandMentionTiming: inputs.brandMentionTiming,
    hookText: inputs.hookText,
    visualContinuity: inputs.visualContinuity,
  });

  // 2. Calculate Audience Trust Score
  const audienceTrust = await calculateAudienceTrustScore(
    inputs.engagementMetrics || {}
  );

  // 3. Calculate Promotion Saturation (inverted for scoring)
  const promotionSaturation = await calculatePromotionSaturation({
    creatorId: inputs.contentItemId,
    promotionalPosts: inputs.creatorHistory?.promotionalPosts || [],
  });
  const saturationScore = 100 - promotionSaturation.promotionalPostRatio * 100;

  // 4. Calculate Fatigue Risk (inverted for scoring)
  const fatigue = await calculateFatigueRisk({
    contentItem: {
      id: inputs.contentItemId,
      structure: inputs.contentStructure || {},
    },
    similarContent: inputs.similarContent || [],
    brandHistory: inputs.brandHistory,
  });
  const fatigueScore = 100 - fatigue.fatigueRiskScore;

  // 5. Synthesize Final Score (weighted average)
  const weights = {
    authenticity: 0.35,
    audienceTrust: 0.30,
    promotionSaturation: 0.20,
    fatigue: 0.15,
  };

  const finalScore =
    authenticity.score * weights.authenticity +
    audienceTrust.trustIndex * weights.audienceTrust +
    saturationScore * weights.promotionSaturation +
    fatigueScore * weights.fatigue;

  // 6. Determine Performance Tier
  let predictedPerformanceTier: PerformanceTier = "medium";
  if (finalScore >= 75) predictedPerformanceTier = "high";
  else if (finalScore < 50) predictedPerformanceTier = "low";

  // 7. Determine Recommended Use Cases
  const recommendedUse: RecommendedUse[] = [];
  if (finalScore >= 70) {
    recommendedUse.push("paid_social");
    recommendedUse.push("homepage");
  }
  if (finalScore >= 60) {
    recommendedUse.push("email");
  }
  if (finalScore >= 50) {
    recommendedUse.push("product_page");
  }
  if (finalScore >= 40) {
    recommendedUse.push("retargeting");
  }

  // 8. Calculate Confidence Interval (simplified)
  const stdDev = 10; // Would be calculated from historical variance
  const confidenceInterval = {
    lower: Math.max(0, finalScore - 1.96 * stdDev),
    upper: Math.min(100, finalScore + 1.96 * stdDev),
  };

  // 9. Build Reason Attribution
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const keyFactors: string[] = [];

  if (authenticity.score >= 70) {
    strengths.push("High authenticity");
    keyFactors.push("Genuine creator voice");
  } else {
    weaknesses.push("Lower authenticity detected");
  }

  if (audienceTrust.trustIndex >= 70) {
    strengths.push("Strong audience trust");
    keyFactors.push("Engaged and trusting audience");
  } else {
    weaknesses.push("Moderate audience trust");
  }

  if (promotionSaturation.saturationRiskLevel === "low") {
    strengths.push("Low promotion saturation");
    keyFactors.push("Creator not over-promoted");
  } else {
    weaknesses.push("High promotion saturation");
  }

  if (fatigue.fatigueRiskScore < 30) {
    strengths.push("Fresh creative format");
    keyFactors.push("Original content structure");
  } else {
    weaknesses.push("Creative fatigue risk");
    keyFactors.push(...fatigue.overusedFormatWarnings);
  }

  // Determine authenticity level
  let authenticityLevel: "high" | "medium" | "low" = "medium";
  if (authenticity.score >= 70) authenticityLevel = "high";
  else if (authenticity.score < 50) authenticityLevel = "low";

  // Determine audience trust level
  let audienceTrustLevel: "very_high" | "high" | "medium" | "low" = "medium";
  if (audienceTrust.trustIndex >= 80) audienceTrustLevel = "very_high";
  else if (audienceTrust.trustIndex >= 65) audienceTrustLevel = "high";
  else if (audienceTrust.trustIndex < 40) audienceTrustLevel = "low";

  return {
    score: Math.round(finalScore),
    authenticity: {
      score: Math.round(authenticity.score),
      level: authenticityLevel,
      scriptLikelihood: Math.round(authenticity.scriptLikelihood),
      reusedHookDetected: authenticity.reusedHookDetected,
      reasons: authenticity.reasons,
    },
    audienceTrust: {
      score: Math.round(audienceTrust.trustIndex),
      level: audienceTrustLevel,
      engagementQualityGrade: audienceTrust.engagementQualityGrade,
      purchaseIntentConfidence: Math.round(
        audienceTrust.purchaseIntentConfidence
      ),
    },
    promotionSaturation: {
      score: Math.round(saturationScore),
      level: promotionSaturation.saturationRiskLevel,
      density: Math.round(promotionSaturation.promotionalPostRatio * 100),
      riskLevel: promotionSaturation.saturationRiskLevel,
    },
    fatigueRisk: {
      score: Math.round(fatigueScore),
      level:
        fatigue.fatigueRiskScore < 30
          ? "low"
          : fatigue.fatigueRiskScore < 60
          ? "medium"
          : "high",
      originalityPercentile: Math.round(fatigue.creativeOriginalityPercentile),
      warnings: fatigue.overusedFormatWarnings,
    },
    predictedPerformanceTier,
    recommendedUse,
    confidenceInterval,
    reasonAttribution: {
      strengths,
      weaknesses,
      keyFactors,
    },
  };
}

