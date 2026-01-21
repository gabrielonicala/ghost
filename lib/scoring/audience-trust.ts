interface EngagementMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  views?: number;
  commentTexts?: string[];
}

/**
 * Calculates audience trust metrics from engagement data
 */
export async function calculateAudienceTrustScore(
  metrics: EngagementMetrics
): Promise<{
  trustIndex: number;
  engagementQualityGrade: string;
  purchaseIntentConfidence: number;
  breakdown: {
    commentSentimentPolarity: number;
    questionDensity: number;
    purchaseIntentKeywords: number;
    repeatCommenterFrequency: number;
    saveToViewRatio: number;
    replyDepthAverage: number;
    emojiToTextRatio: number;
  };
}> {
  let trustIndex = 50; // Start neutral
  const breakdown: any = {};

  // 1. Comment Sentiment Analysis
  let commentSentimentPolarity = 0;
  if (metrics.commentTexts && metrics.commentTexts.length > 0) {
    commentSentimentPolarity = analyzeCommentSentiment(metrics.commentTexts);
    if (commentSentimentPolarity > 0.3) {
      trustIndex += 15;
    } else if (commentSentimentPolarity < -0.3) {
      trustIndex -= 20;
    }
  }
  breakdown.commentSentimentPolarity = commentSentimentPolarity;

  // 2. Question Density (high = good, shows interest)
  let questionDensity = 0;
  if (metrics.comments && metrics.views) {
    const questionCount = metrics.commentTexts?.filter((c) =>
      c.includes("?")
    ).length || 0;
    questionDensity = questionCount / Math.max(metrics.comments, 1);
    if (questionDensity > 0.2) {
      trustIndex += 12;
    }
  }
  breakdown.questionDensity = questionDensity;

  // 3. Purchase Intent Keywords
  const purchaseIntentKeywords = [
    "where to buy",
    "link",
    "price",
    "purchase",
    "checkout",
    "add to cart",
    "available",
    "stock",
  ];
  let purchaseIntentKeywordCount = 0;
  if (metrics.commentTexts) {
    purchaseIntentKeywordCount = metrics.commentTexts.filter((comment) =>
      purchaseIntentKeywords.some((keyword) =>
        comment.toLowerCase().includes(keyword)
      )
    ).length;
    if (purchaseIntentKeywordCount > 0) {
      trustIndex += Math.min(15, purchaseIntentKeywordCount * 3);
    }
  }
  breakdown.purchaseIntentKeywords = purchaseIntentKeywordCount;

  // 4. Save-to-View Ratio (high = strong intent)
  let saveToViewRatio = 0;
  if (metrics.saves && metrics.views) {
    saveToViewRatio = metrics.saves / metrics.views;
    if (saveToViewRatio > 0.05) {
      trustIndex += 10;
    } else if (saveToViewRatio < 0.01) {
      trustIndex -= 5;
    }
  }
  breakdown.saveToViewRatio = saveToViewRatio;

  // 5. Reply Depth (creator engagement = trust)
  let replyDepthAverage = 0;
  if (metrics.commentTexts) {
    // Simplified: count threads (comments with replies)
    replyDepthAverage = metrics.commentTexts.length > 10 ? 0.3 : 0.1;
    if (replyDepthAverage > 0.25) {
      trustIndex += 8;
    }
  }
  breakdown.replyDepthAverage = replyDepthAverage;

  // 6. Emoji-to-Text Ratio (high emoji = less thoughtful engagement)
  let emojiToTextRatio = 0;
  if (metrics.commentTexts) {
    const emojiCount = metrics.commentTexts.reduce(
      (count, comment) =>
        count + (comment.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
      0
    );
    const textLength = metrics.commentTexts.reduce(
      (sum, comment) => sum + comment.length,
      0
    );
    emojiToTextRatio = emojiCount / Math.max(textLength, 1);
    if (emojiToTextRatio > 0.1) {
      trustIndex -= 5; // Too many emojis = less serious engagement
    }
  }
  breakdown.emojiToTextRatio = emojiToTextRatio;

  // 7. Repeat Commenter Frequency (simplified)
  let repeatCommenterFrequency = 0.1; // Would analyze actual commenter IDs
  breakdown.repeatCommenterFrequency = repeatCommenterFrequency;

  // Normalize to 0-100
  trustIndex = Math.max(0, Math.min(100, trustIndex));

  // Calculate engagement quality grade
  let engagementQualityGrade = "C";
  if (trustIndex >= 80) engagementQualityGrade = "A";
  else if (trustIndex >= 65) engagementQualityGrade = "B";
  else if (trustIndex >= 50) engagementQualityGrade = "C";
  else if (trustIndex >= 35) engagementQualityGrade = "D";
  else engagementQualityGrade = "F";

  // Purchase intent confidence (based on multiple signals)
  const purchaseIntentConfidence = Math.min(
    100,
    Math.max(
      0,
      (purchaseIntentKeywordCount * 10 +
        questionDensity * 30 +
        saveToViewRatio * 200) /
        3
    )
  );

  return {
    trustIndex,
    engagementQualityGrade,
    purchaseIntentConfidence,
    breakdown,
  };
}

/**
 * Simple sentiment analysis (would use ML model in production)
 */
function analyzeCommentSentiment(comments: string[]): number {
  const positiveWords = [
    "love",
    "amazing",
    "great",
    "best",
    "awesome",
    "perfect",
    "beautiful",
    "wow",
    "incredible",
  ];
  const negativeWords = [
    "hate",
    "terrible",
    "awful",
    "bad",
    "worst",
    "disappointed",
    "fake",
    "scam",
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  comments.forEach((comment) => {
    const lower = comment.toLowerCase();
    positiveWords.forEach((word) => {
      if (lower.includes(word)) positiveCount++;
    });
    negativeWords.forEach((word) => {
      if (lower.includes(word)) negativeCount++;
    });
  });

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  // Return polarity: -1 to 1
  return (positiveCount - negativeCount) / Math.max(total, 1);
}

