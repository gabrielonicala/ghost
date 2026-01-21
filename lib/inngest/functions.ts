import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { calculateACCS } from "@/lib/scoring/accs";
import { detectBrandContent } from "@/lib/detection/brand-detection";
import { performOCR, transcribeAudio, extractFrames } from "@/lib/processing/media";

/**
 * Process content item: OCR, transcription, brand detection, ACCS scoring
 */
export const processContentItem = inngest.createFunction(
  { id: "process-content-item" },
  { event: "content/process" },
  async ({ event, step }) => {
    const { contentItemId, organizationId } = event.data;

    // Step 1: Fetch content item
    const contentItem = await step.run("fetch-content", async () => {
      return await prisma.contentItem.findUnique({
        where: { id: contentItemId },
        include: {
          creator: true,
        },
      });
    });

    if (!contentItem) {
      throw new Error(`Content item not found: ${contentItemId}`);
    }

    // Step 2: Extract transcript (if video)
    let transcript: string | undefined;
    if (contentItem.contentType === "video" || contentItem.contentType === "reel") {
      transcript = await step.run("transcribe-audio", async () => {
        try {
          // TODO: Extract audio and transcribe
          // const audioBuffer = await extractAudio(contentItem.mediaUrl);
          // const result = await transcribeAudio(audioBuffer);
          // return result.text;
          return undefined as string | undefined; // Placeholder
        } catch (error) {
          console.error("Transcription error:", error);
          return undefined as string | undefined;
        }
      }) || undefined;

      if (transcript) {
        await prisma.contentTranscript.create({
          data: {
            contentItemId: contentItem.id,
            text: transcript,
            language: "en",
            confidence: 0.9,
          },
        });
      }
    }

    // Step 3: Extract OCR text (if image/video)
    const ocrTexts: string[] = await step.run("extract-ocr", async () => {
      try {
        if (contentItem.contentType === "image" || contentItem.contentType === "post") {
          const ocrResult = await performOCR(contentItem.mediaUrl);
          return ocrResult.text ? [ocrResult.text] : [];
        } else if (contentItem.contentType === "video" || contentItem.contentType === "reel") {
          // Extract frames and OCR them
          const frames = await extractFrames(contentItem.mediaUrl, 5);
          const texts: string[] = [];
          for (const frame of frames) {
            const ocrResult = await performOCR(frame.imageUrl);
            if (ocrResult.text) {
              texts.push(ocrResult.text);
              await prisma.contentOcrFrame.create({
                data: {
                  contentItemId: contentItem.id,
                  frameIndex: frame.index,
                  text: ocrResult.text,
                  confidence: ocrResult.confidence,
                },
              });
            }
          }
          return texts;
        }
        return [];
      } catch (error) {
        console.error("OCR error:", error);
        return [];
      }
    });

    // Step 4: Detect brand content
    await step.run("detect-brands", async () => {
      try {
        await detectBrandContent(
          contentItem.id,
          organizationId,
          {
            caption: contentItem.caption || undefined,
            transcript,
            ocrText: ocrTexts,
          }
        );
      } catch (error) {
        console.error("Brand detection error:", error);
      }
    });

    // Step 5: Calculate ACCS score
    const accsScore = await step.run("calculate-accs", async () => {
      // Get engagement metrics
      const latestMetrics = await prisma.contentMetricsSnapshot.findFirst({
        where: { contentItemId: contentItem.id },
        orderBy: { snapshotAt: "desc" },
      });

      // Get creator history
      const creatorPromotions = await prisma.contentItem.findMany({
        where: {
          creatorId: contentItem.creatorId,
          id: { not: contentItem.id },
          publishedAt: { lt: contentItem.publishedAt },
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: {
          caption: true,
          publishedAt: true,
        },
      });

      // Get similar content
      const similarContent = await prisma.contentItem.findMany({
        where: {
          creatorId: contentItem.creatorId,
          id: { not: contentItem.id },
        },
        take: 10,
      });

      const score = await calculateACCS({
        contentItemId: contentItem.id,
        transcript,
        caption: contentItem.caption || undefined,
        engagementMetrics: latestMetrics
          ? {
              views: latestMetrics.views || undefined,
              likes: latestMetrics.likes || undefined,
              comments: latestMetrics.comments || undefined,
              shares: latestMetrics.shares || undefined,
              saves: latestMetrics.saves || undefined,
            }
          : undefined,
        creatorHistory: {
          previousPromotions: creatorPromotions
            .map((p: { caption: string | null }) => p.caption || "")
            .filter((c: string) => c.length > 0),
          scriptPatterns: [],
          promotionalPosts: creatorPromotions.map((p: { publishedAt: Date }) => ({
            date: p.publishedAt,
          })),
        },
        similarContent: similarContent.map((item: { id: string }) => ({
          id: item.id,
          structure: {},
          similarity: 0.5, // Would calculate actual similarity
        })),
      });

      // Save ACCS score
      await prisma.conversionConfidenceScore.create({
        data: {
          contentItemId: contentItem.id,
          score: score.score,
          authenticityScore: score.authenticity.score,
          audienceTrustScore: score.audienceTrust.score,
          promotionSaturationScore: score.promotionSaturation.score,
          fatigueRiskScore: score.fatigueRisk.score,
          predictedPerformanceTier: score.predictedPerformanceTier,
          recommendedUse: score.recommendedUse,
          confidenceInterval: score.confidenceInterval,
          reasonAttribution: score.reasonAttribution,
        },
      });

      // Save individual dimension scores
      await prisma.authenticitySignal.create({
        data: {
          contentItemId: contentItem.id,
          creatorId: contentItem.creatorId,
          score: score.authenticity.score,
          scriptLikelihood: score.authenticity.scriptLikelihood,
          reusedHookDetected: score.authenticity.reusedHookDetected,
          reasonBreakdown: { reasons: score.authenticity.reasons },
        },
      });

      if (latestMetrics) {
        await prisma.audienceTrustMetric.create({
          data: {
            contentItemId: contentItem.id,
            trustIndex: score.audienceTrust.score,
            engagementQualityGrade: score.audienceTrust.engagementQualityGrade,
            purchaseIntentConfidence: score.audienceTrust.purchaseIntentConfidence,
          },
        });
      }

      return score;
    });

    return {
      contentItemId,
      accsScore: accsScore.score,
      status: "processed",
    };
  }
);

