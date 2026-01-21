import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
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
      if (prisma) {
        return await prisma.contentItem.findUnique({
          where: { id: contentItemId },
          include: {
            creator: true,
          },
        });
      } else if (supabase) {
        const { data, error } = await supabase
          .from("ContentItem")
          .select("*, creator:Creator(*)")
          .eq("id", contentItemId)
          .single();
        if (error) throw error;
        return data as any;
      } else {
        throw new Error("No database client available");
      }
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

      if (transcript && prisma) {
        await prisma.contentTranscript.create({
          data: {
            contentItemId: contentItem.id,
            text: transcript,
            language: "en",
            confidence: 0.9,
          },
        });
      } else if (transcript && supabase) {
        const transcriptId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        await supabase.from("ContentTranscript").insert({
          id: transcriptId,
          contentItemId: contentItem.id,
          text: transcript,
          language: "en",
          confidence: 0.9,
          createdAt: new Date().toISOString(),
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
              if (prisma) {
                await prisma.contentOcrFrame.create({
                  data: {
                    contentItemId: contentItem.id,
                    frameIndex: frame.index,
                    text: ocrResult.text,
                    confidence: ocrResult.confidence,
                  },
                });
              } else if (supabase) {
                const frameId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
                await supabase.from("ContentOcrFrame").insert({
                  id: frameId,
                  contentItemId: contentItem.id,
                  frameIndex: frame.index,
                  text: ocrResult.text,
                  confidence: ocrResult.confidence,
                  createdAt: new Date().toISOString(),
                });
              }
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
      if (!prisma && !supabase) {
        throw new Error("No database client available for ACCS calculation");
      }
      
      // Get engagement metrics
      let latestMetrics = null;
      if (prisma) {
        latestMetrics = await prisma.contentMetricsSnapshot.findFirst({
          where: { contentItemId: contentItem.id },
          orderBy: { snapshotAt: "desc" },
        });
      } else if (supabase) {
        const { data } = await supabase
          .from("ContentMetricsSnapshot")
          .select("*")
          .eq("contentItemId", contentItem.id)
          .order("snapshotAt", { ascending: false })
          .limit(1)
          .single();
        latestMetrics = data;
      }

      // Get creator history
      let creatorPromotions: any[] = [];
      if (prisma) {
        creatorPromotions = await prisma.contentItem.findMany({
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
      } else if (supabase) {
        const { data } = await supabase
          .from("ContentItem")
          .select("caption, publishedAt")
          .eq("creatorId", contentItem.creatorId)
          .neq("id", contentItem.id)
          .lt("publishedAt", contentItem.publishedAt)
          .order("publishedAt", { ascending: false })
          .limit(20);
        creatorPromotions = data || [];
      }

      // Get similar content
      let similarContent: any[] = [];
      if (prisma) {
        similarContent = await prisma.contentItem.findMany({
          where: {
            creatorId: contentItem.creatorId,
            id: { not: contentItem.id },
          },
          take: 10,
        });
      } else if (supabase) {
        const { data } = await supabase
          .from("ContentItem")
          .select("id")
          .eq("creatorId", contentItem.creatorId)
          .neq("id", contentItem.id)
          .limit(10);
        similarContent = (data || []).map((item: { id: string }) => ({
          id: item.id,
          structure: {},
          similarity: 0.5,
        }));
      }

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
      if (prisma) {
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
      } else if (supabase) {
        // Save using Supabase
        const scoreId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        await supabase.from("ConversionConfidenceScore").insert({
          id: scoreId,
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
          computedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        const authId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        await supabase.from("AuthenticitySignal").insert({
          id: authId,
          contentItemId: contentItem.id,
          creatorId: contentItem.creatorId,
          score: score.authenticity.score,
          scriptLikelihood: score.authenticity.scriptLikelihood,
          reusedHookDetected: score.authenticity.reusedHookDetected,
          reasonBreakdown: { reasons: score.authenticity.reasons },
          computedAt: new Date().toISOString(),
        });

        if (latestMetrics) {
          const trustId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
          await supabase.from("AudienceTrustMetric").insert({
            id: trustId,
            contentItemId: contentItem.id,
            trustIndex: score.audienceTrust.score,
            engagementQualityGrade: score.audienceTrust.engagementQualityGrade,
            purchaseIntentConfidence: score.audienceTrust.purchaseIntentConfidence,
            computedAt: new Date().toISOString(),
          });
        }
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

