// Core types for the platform

export type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "facebook";

export type ContentType = "video" | "image" | "reel" | "post" | "story";

export type PerformanceTier = "high" | "medium" | "low";

export type RecommendedUse = "paid_social" | "homepage" | "email" | "product_page" | "retargeting";

export interface ACCSScore {
  score: number; // 0-100
  authenticity: {
    score: number;
    level: "high" | "medium" | "low";
    scriptLikelihood: number;
    reusedHookDetected: boolean;
    reasons: string[];
  };
  audienceTrust: {
    score: number;
    level: "very_high" | "high" | "medium" | "low";
    engagementQualityGrade: string;
    purchaseIntentConfidence: number;
  };
  promotionSaturation: {
    score: number; // Inverted - lower saturation = higher score
    level: "low" | "medium" | "high";
    density: number;
    riskLevel: string;
  };
  fatigueRisk: {
    score: number; // Inverted - lower fatigue = higher score
    level: "low" | "medium" | "high";
    originalityPercentile: number;
    warnings: string[];
  };
  predictedPerformanceTier: PerformanceTier;
  recommendedUse: RecommendedUse[];
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  reasonAttribution: {
    strengths: string[];
    weaknesses: string[];
    keyFactors: string[];
  };
}

export interface ContentItemWithScores {
  id: string;
  platform: Platform;
  contentType: ContentType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  publishedAt: Date;
  creator: {
    id: string;
    username: string;
    displayName?: string;
  };
  accsScore?: ACCSScore;
  ocrFrames?: Array<{
    id: string;
    frameIndex: number;
    text: string;
    confidence: number;
  }>;
  transcripts?: Array<{
    id: string;
    text: string;
    language: string;
    confidence: number;
  }>;
}

