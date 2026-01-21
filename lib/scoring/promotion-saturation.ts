interface CreatorPromotionHistory {
  creatorId: string;
  promotionalPosts: Array<{
    date: Date;
    brandName?: string;
    category?: string;
  }>;
}

/**
 * Calculates promotion saturation metrics for a creator
 */
export async function calculatePromotionSaturation(
  history: CreatorPromotionHistory,
  periodDays: number = 90
): Promise<{
  promotionalPostRatio: number;
  competingBrandsCount: number;
  categoryOverlapFreq: number;
  promotionClustering: number;
  sponsoredSpacingAvg: number;
  saturationRiskLevel: "low" | "medium" | "high";
  recommendedCooldown: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  const recentPromotions = history.promotionalPosts.filter(
    (p) => new Date(p.date) >= cutoffDate
  );

  // 1. Promotional Post Ratio
  // This would need total post count - simplified here
  const promotionalPostRatio = Math.min(1, recentPromotions.length / 30); // Assume ~30 posts in period

  // 2. Competing Brands Count
  const uniqueBrands = new Set(
    recentPromotions
      .map((p) => p.brandName)
      .filter((b): b is string => !!b)
  );
  const competingBrandsCount = uniqueBrands.size;

  // 3. Category Overlap Frequency
  const categories = recentPromotions
    .map((p) => p.category)
    .filter((c): c is string => !!c);
  const categoryFreq: Record<string, number> = {};
  categories.forEach((cat) => {
    categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
  });
  const categoryOverlapFreq =
    Object.values(categoryFreq).reduce((sum, count) => sum + count - 1, 0) /
    Math.max(categories.length, 1);

  // 4. Promotion Clustering (how close together are promotions)
  let promotionClustering = 0;
  if (recentPromotions.length > 1) {
    const sortedDates = recentPromotions
      .map((p) => new Date(p.date).getTime())
      .sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      gaps.push(sortedDates[i] - sortedDates[i - 1]);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const daysInPeriod = periodDays * 24 * 60 * 60 * 1000;
    // Lower average gap = higher clustering
    promotionClustering = 1 - avgGap / daysInPeriod;
  }

  // 5. Sponsored Content Spacing
  let sponsoredSpacingAvg = 0;
  if (recentPromotions.length > 1) {
    const sortedDates = recentPromotions
      .map((p) => new Date(p.date).getTime())
      .sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      gaps.push((sortedDates[i] - sortedDates[i - 1]) / (24 * 60 * 60 * 1000)); // Convert to days
    }
    sponsoredSpacingAvg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  // 6. Calculate Saturation Risk Level
  let saturationRiskLevel: "low" | "medium" | "high" = "low";
  let riskScore = 0;

  if (promotionalPostRatio > 0.5) riskScore += 3;
  else if (promotionalPostRatio > 0.3) riskScore += 2;
  else if (promotionalPostRatio > 0.15) riskScore += 1;

  if (competingBrandsCount > 5) riskScore += 3;
  else if (competingBrandsCount > 3) riskScore += 2;
  else if (competingBrandsCount > 1) riskScore += 1;

  if (promotionClustering > 0.7) riskScore += 2;
  else if (promotionClustering > 0.5) riskScore += 1;

  if (sponsoredSpacingAvg < 3) riskScore += 2; // Less than 3 days between
  else if (sponsoredSpacingAvg < 7) riskScore += 1;

  if (riskScore >= 7) saturationRiskLevel = "high";
  else if (riskScore >= 4) saturationRiskLevel = "medium";

  // 7. Recommended Cooldown
  let recommendedCooldown = 0;
  if (saturationRiskLevel === "high") {
    recommendedCooldown = 30; // 30 days
  } else if (saturationRiskLevel === "medium") {
    recommendedCooldown = 14; // 14 days
  } else {
    recommendedCooldown = 7; // 7 days minimum
  }

  return {
    promotionalPostRatio,
    competingBrandsCount,
    categoryOverlapFreq,
    promotionClustering,
    sponsoredSpacingAvg: sponsoredSpacingAvg || 0,
    saturationRiskLevel,
    recommendedCooldown,
  };
}

