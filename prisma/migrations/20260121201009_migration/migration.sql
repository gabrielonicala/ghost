-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileImageUrl" TEXT,
    "followerCount" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorIdentity" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brief" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCreator" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "CampaignCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "campaignId" TEXT,
    "platform" TEXT NOT NULL,
    "platformContentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "engagementRate" DOUBLE PRECISION,

    CONSTRAINT "ContentMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTranscript" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentOcrFrame" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "frameIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "boundingBoxes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentOcrFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVisualFeature" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "embedding" TEXT,
    "hash" TEXT,
    "dominantColors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVisualFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSimilarityHash" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "hashType" TEXT NOT NULL,
    "hashValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentSimilarityHash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandDictionary" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "keywords" TEXT[],
    "productNames" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandDictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandDetection" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "brandDictionaryId" TEXT NOT NULL,
    "detectionMethod" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "matchedText" TEXT,
    "matchedKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthenticitySignal" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT,
    "creatorId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "scriptLikelihood" DOUBLE PRECISION,
    "reusedHookDetected" BOOLEAN NOT NULL DEFAULT false,
    "transcriptEntropy" DOUBLE PRECISION,
    "phraseReuseCount" INTEGER,
    "naturalPacingScore" DOUBLE PRECISION,
    "brandMentionTiming" DOUBLE PRECISION,
    "hookOriginality" DOUBLE PRECISION,
    "visualContinuity" DOUBLE PRECISION,
    "reasonBreakdown" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticitySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceTrustMetric" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "trustIndex" DOUBLE PRECISION NOT NULL,
    "engagementQualityGrade" TEXT,
    "purchaseIntentConfidence" DOUBLE PRECISION,
    "commentSentimentPolarity" DOUBLE PRECISION,
    "questionDensity" DOUBLE PRECISION,
    "purchaseIntentKeywords" INTEGER,
    "repeatCommenterFrequency" DOUBLE PRECISION,
    "saveToViewRatio" DOUBLE PRECISION,
    "replyDepthAverage" DOUBLE PRECISION,
    "emojiToTextRatio" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceTrustMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionDensityMetric" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "promotionalPostRatio" DOUBLE PRECISION NOT NULL,
    "competingBrandsCount" INTEGER,
    "categoryOverlapFreq" DOUBLE PRECISION,
    "promotionClustering" DOUBLE PRECISION,
    "sponsoredSpacingAvg" DOUBLE PRECISION,
    "saturationRiskLevel" TEXT,
    "recommendedCooldown" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionDensityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UgcFatigueMetric" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "fatigueRiskScore" DOUBLE PRECISION NOT NULL,
    "creativeOriginalityPercentile" DOUBLE PRECISION,
    "structuralSimilarity" DOUBLE PRECISION,
    "hookPatternReuseFreq" DOUBLE PRECISION,
    "visualCompositionOverlap" DOUBLE PRECISION,
    "audioTrendSaturation" DOUBLE PRECISION,
    "brandLevelRepetition" DOUBLE PRECISION,
    "industryLevelExhaustion" DOUBLE PRECISION,
    "overusedFormatWarnings" TEXT[],
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UgcFatigueMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionConfidenceScore" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "authenticityScore" DOUBLE PRECISION NOT NULL,
    "audienceTrustScore" DOUBLE PRECISION NOT NULL,
    "promotionSaturationScore" DOUBLE PRECISION NOT NULL,
    "fatigueRiskScore" DOUBLE PRECISION NOT NULL,
    "predictedPerformanceTier" TEXT,
    "recommendedUse" TEXT[],
    "confidenceInterval" JSONB,
    "reasonAttribution" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionConfidenceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignPerformance" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "integrationId" TEXT,
    "contentItemId" TEXT,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Creator_platform_username_idx" ON "Creator"("platform", "username");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_platform_platformId_key" ON "Creator"("platform", "platformId");

-- CreateIndex
CREATE INDEX "CreatorIdentity_creatorId_idx" ON "CreatorIdentity"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorIdentity_platform_platformId_key" ON "CreatorIdentity"("platform", "platformId");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_status_idx" ON "Campaign"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CampaignCreator_campaignId_idx" ON "CampaignCreator"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignCreator_creatorId_idx" ON "CampaignCreator"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCreator_campaignId_creatorId_key" ON "CampaignCreator"("campaignId", "creatorId");

-- CreateIndex
CREATE INDEX "ContentItem_creatorId_idx" ON "ContentItem"("creatorId");

-- CreateIndex
CREATE INDEX "ContentItem_campaignId_idx" ON "ContentItem"("campaignId");

-- CreateIndex
CREATE INDEX "ContentItem_publishedAt_idx" ON "ContentItem"("publishedAt");

-- CreateIndex
CREATE INDEX "ContentItem_detectedAt_idx" ON "ContentItem"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_platform_platformContentId_key" ON "ContentItem"("platform", "platformContentId");

-- CreateIndex
CREATE INDEX "ContentMetricsSnapshot_contentItemId_snapshotAt_idx" ON "ContentMetricsSnapshot"("contentItemId", "snapshotAt");

-- CreateIndex
CREATE INDEX "ContentTranscript_contentItemId_idx" ON "ContentTranscript"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentOcrFrame_contentItemId_idx" ON "ContentOcrFrame"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentVisualFeature_contentItemId_idx" ON "ContentVisualFeature"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentSimilarityHash_contentItemId_hashType_idx" ON "ContentSimilarityHash"("contentItemId", "hashType");

-- CreateIndex
CREATE INDEX "ContentSimilarityHash_hashValue_idx" ON "ContentSimilarityHash"("hashValue");

-- CreateIndex
CREATE INDEX "BrandDictionary_organizationId_idx" ON "BrandDictionary"("organizationId");

-- CreateIndex
CREATE INDEX "BrandDetection_contentItemId_idx" ON "BrandDetection"("contentItemId");

-- CreateIndex
CREATE INDEX "BrandDetection_brandDictionaryId_idx" ON "BrandDetection"("brandDictionaryId");

-- CreateIndex
CREATE INDEX "BrandDetection_detectionMethod_idx" ON "BrandDetection"("detectionMethod");

-- CreateIndex
CREATE INDEX "AuthenticitySignal_contentItemId_idx" ON "AuthenticitySignal"("contentItemId");

-- CreateIndex
CREATE INDEX "AuthenticitySignal_creatorId_idx" ON "AuthenticitySignal"("creatorId");

-- CreateIndex
CREATE INDEX "AuthenticitySignal_computedAt_idx" ON "AuthenticitySignal"("computedAt");

-- CreateIndex
CREATE INDEX "AudienceTrustMetric_contentItemId_idx" ON "AudienceTrustMetric"("contentItemId");

-- CreateIndex
CREATE INDEX "AudienceTrustMetric_computedAt_idx" ON "AudienceTrustMetric"("computedAt");

-- CreateIndex
CREATE INDEX "PromotionDensityMetric_creatorId_periodDays_idx" ON "PromotionDensityMetric"("creatorId", "periodDays");

-- CreateIndex
CREATE INDEX "PromotionDensityMetric_computedAt_idx" ON "PromotionDensityMetric"("computedAt");

-- CreateIndex
CREATE INDEX "UgcFatigueMetric_contentItemId_idx" ON "UgcFatigueMetric"("contentItemId");

-- CreateIndex
CREATE INDEX "UgcFatigueMetric_computedAt_idx" ON "UgcFatigueMetric"("computedAt");

-- CreateIndex
CREATE INDEX "ConversionConfidenceScore_score_idx" ON "ConversionConfidenceScore"("score");

-- CreateIndex
CREATE INDEX "ConversionConfidenceScore_computedAt_idx" ON "ConversionConfidenceScore"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionConfidenceScore_contentItemId_key" ON "ConversionConfidenceScore"("contentItemId");

-- CreateIndex
CREATE INDEX "Integration_organizationId_idx" ON "Integration"("organizationId");

-- CreateIndex
CREATE INDEX "CampaignPerformance_campaignId_idx" ON "CampaignPerformance"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignPerformance_contentItemId_idx" ON "CampaignPerformance"("contentItemId");

-- CreateIndex
CREATE INDEX "CampaignPerformance_recordedAt_idx" ON "CampaignPerformance"("recordedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorIdentity" ADD CONSTRAINT "CreatorIdentity_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCreator" ADD CONSTRAINT "CampaignCreator_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCreator" ADD CONSTRAINT "CampaignCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentMetricsSnapshot" ADD CONSTRAINT "ContentMetricsSnapshot_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTranscript" ADD CONSTRAINT "ContentTranscript_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentOcrFrame" ADD CONSTRAINT "ContentOcrFrame_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVisualFeature" ADD CONSTRAINT "ContentVisualFeature_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSimilarityHash" ADD CONSTRAINT "ContentSimilarityHash_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandDictionary" ADD CONSTRAINT "BrandDictionary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandDetection" ADD CONSTRAINT "BrandDetection_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandDetection" ADD CONSTRAINT "BrandDetection_brandDictionaryId_fkey" FOREIGN KEY ("brandDictionaryId") REFERENCES "BrandDictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticitySignal" ADD CONSTRAINT "AuthenticitySignal_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticitySignal" ADD CONSTRAINT "AuthenticitySignal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceTrustMetric" ADD CONSTRAINT "AudienceTrustMetric_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionDensityMetric" ADD CONSTRAINT "PromotionDensityMetric_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UgcFatigueMetric" ADD CONSTRAINT "UgcFatigueMetric_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionConfidenceScore" ADD CONSTRAINT "ConversionConfidenceScore_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPerformance" ADD CONSTRAINT "CampaignPerformance_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPerformance" ADD CONSTRAINT "CampaignPerformance_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPerformance" ADD CONSTRAINT "CampaignPerformance_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
