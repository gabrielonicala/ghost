import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { calculateACCS } from "@/lib/scoring/accs";
import { detectBrandContent } from "@/lib/detection/brand-detection";
import {
  performOCR,
  transcribeAudio,
  extractFrames,
  generateVisualEmbedding,
  calculatePerceptualHash,
  extractDominantColors,
} from "@/lib/processing/media";

/**
 * Process content item: OCR, transcription, brand detection, ACCS scoring
 * 
 * Note: Heavy operations (OCR, transcription) are optional and will be skipped
 * if they timeout, allowing the function to complete successfully with available data.
 */
export const processContentItem = inngest.createFunction(
  { 
    id: "process-content-item",
    // Note: Heavy operations (OCR, transcription) have step-level timeouts
    // and will be skipped if they timeout, allowing the function to complete
  },
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

    // Step 2: Extract transcript (if video) - MANDATORY for videos
    let transcript: string | undefined;
    if (contentItem.contentType === "video" || contentItem.contentType === "reel") {
      transcript = await step.run("transcribe-audio", async () => {
        // Use OpenAI Whisper API directly with video URL
        // This will throw if it fails, causing Inngest to retry
        const result = await transcribeAudio(contentItem.mediaUrl);
        return result.text;
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

    // Step 3: Extract OCR text (if image/video) - MANDATORY for images
    const ocrTexts: string[] = await step.run("extract-ocr", async () => {
      if (contentItem.contentType === "image" || contentItem.contentType === "post") {
        // MANDATORY: OCR must succeed for images
        const ocrResult = await performOCR(contentItem.mediaUrl);
        const text = ocrResult.text || "";
        
        // Save OCR result to database for images too
        if (text && prisma) {
          await prisma.contentOcrFrame.create({
            data: {
              contentItemId: contentItem.id,
              frameIndex: 0, // Images have a single "frame" at index 0
              text: text,
              confidence: ocrResult.confidence,
            },
          });
        } else if (text && supabase) {
          const frameId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
          await supabase.from("ContentOcrFrame").insert({
            id: frameId,
            contentItemId: contentItem.id,
            frameIndex: 0, // Images have a single "frame" at index 0
            text: text,
            confidence: ocrResult.confidence,
            createdAt: new Date().toISOString(),
          });
        }
        
        return text ? [text] : [];
      } else if (contentItem.contentType === "video" || contentItem.contentType === "reel") {
        const texts: string[] = [];
        
        console.log("=".repeat(80));
        console.log("[OCR] 🎥 Processing video OCR using Video Intelligence API ONLY");
        console.log("[OCR] Media URL:", contentItem.mediaUrl);
        console.log("=".repeat(80));
        
        // Use the SAME video download logic as transcription
        const { detectPlatform } = await import("@/lib/platforms");
        const { 
          downloadVideoWithApify, 
          isApifyConfigured, 
          downloadVideoFile,
          fetchYouTubeDirectVideoUrl,
        } = await import("@/lib/platforms/apify");
        
        const platformInfo = detectPlatform(contentItem.mediaUrl);
        let videoBuffer: Buffer | undefined;
        
        // YouTube: Use Apify video downloader for direct URL
        if (platformInfo?.platform === "youtube" && isApifyConfigured()) {
          console.log("[OCR] Using Apify YouTube downloader for direct video URL...");
          try {
            const downloadResult = await fetchYouTubeDirectVideoUrl(contentItem.mediaUrl);
            
            if (downloadResult?.directVideoUrl) {
              console.log("[OCR] Got YouTube direct URL:", downloadResult.directVideoUrl.slice(0, 100) + "...");
              videoBuffer = await downloadVideoFile(downloadResult.directVideoUrl);
              console.log("[OCR] Downloaded YouTube video:", videoBuffer.length, "bytes");
            } else {
              console.warn("[OCR] YouTube downloader returned no direct URL");
            }
          } catch (ytError: any) {
            console.error("[OCR] YouTube video download failed:", ytError.message);
          }
        }
        // TikTok/Instagram/Facebook: Use existing Apify downloaders
        else if (platformInfo && ["tiktok", "instagram", "facebook"].includes(platformInfo.platform) && isApifyConfigured()) {
          console.log("[OCR] Using Apify to download video (same as transcription)");
          const apifyResult = await downloadVideoWithApify(
            contentItem.mediaUrl,
            platformInfo.platform as "tiktok" | "instagram" | "facebook"
          );
          
          if (apifyResult?.videoUrl) {
            console.log("[OCR] Got Apify video URL:", apifyResult.videoUrl);
            videoBuffer = await downloadVideoFile(apifyResult.videoUrl);
            console.log("[OCR] Downloaded video:", videoBuffer.length, "bytes");
          }
        } else if (contentItem.mediaUrl.includes("api.apify.com")) {
          // Direct Apify URL
          videoBuffer = await downloadVideoFile(contentItem.mediaUrl);
          console.log("[OCR] Downloaded Apify video:", videoBuffer.length, "bytes");
        } else {
          // Try direct download
          try {
            const response = await fetch(contentItem.mediaUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              videoBuffer = Buffer.from(arrayBuffer);
              console.log("[OCR] Downloaded video directly:", videoBuffer.length, "bytes");
            }
          } catch (error) {
            console.error("[OCR] Failed to download video:", error);
          }
        }
        
        if (!videoBuffer) {
          console.error("[OCR] ❌ Could not download video buffer");
          return [];
        }
        
        // Use Video Intelligence API ONLY
        const { extractTextFromVideo, isVideoIntelligenceAvailable } = await import("@/lib/processing/video-intelligence");
        
        if (!isVideoIntelligenceAvailable()) {
          console.error("[OCR] ❌ Video Intelligence API not available");
          console.error("[OCR] Check GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_KEY");
          return [];
        }
        
        console.log("[OCR] ✅ Video Intelligence API is available");
        console.log("[OCR] Calling extractTextFromVideo with buffer size:", videoBuffer.length);
        
        try {
          const result = await extractTextFromVideo(undefined, videoBuffer);
          
          console.log("[OCR] Video Intelligence result:", {
            textCount: result.texts.length,
            fullTextLength: result.fullText.length,
            fullTextPreview: result.fullText.slice(0, 500),
          });
          
          if (result.fullText && result.fullText.trim().length > 0) {
            console.log("[OCR] ✅ Video Intelligence found text!");
            texts.push(result.fullText);
            
            // Save to database
            if (prisma) {
              await prisma.contentOcrFrame.create({
                data: {
                  contentItemId: contentItem.id,
                  frameIndex: 0,
                  text: result.fullText,
                  confidence: 0.9,
                },
              });
            } else if (supabase) {
              const frameId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
              await supabase.from("ContentOcrFrame").insert({
                id: frameId,
                contentItemId: contentItem.id,
                frameIndex: 0,
                text: result.fullText,
                confidence: 0.9,
                createdAt: new Date().toISOString(),
              });
            }
            
            return texts;
          } else {
            console.warn("[OCR] ⚠️ Video Intelligence returned empty text");
            return [];
          }
        } catch (viError: any) {
          console.error("[OCR] ❌ Video Intelligence API failed:");
          console.error("[OCR] Error message:", viError.message);
          console.error("[OCR] Error stack:", viError.stack);
          throw viError; // Re-throw so Inngest can retry
        }
        
        // CLOUD VISION API CODE COMMENTED OUT - FOCUS ON VIDEO INTELLIGENCE ONLY
        /*
        // Fallback: Extract frames and use Cloud Vision API
        console.log("[OCR] 🔄 FALLBACK: Using frame extraction + Cloud Vision API");
        
        if (!videoBuffer) {
          console.warn("[OCR] ⚠️ No video buffer available, using thumbnail OCR");
          const thumbnailFrames = await extractFrames(contentItem.mediaUrl, 1);
          for (const frame of thumbnailFrames) {
            try {
              const ocrResult = await performOCR(frame.imageUrl);
              if (ocrResult.text && ocrResult.text.trim().length > 0) {
                texts.push(ocrResult.text);
                // ... save logic ...
              }
            } catch (frameError) {
              console.error(`[OCR] Error processing thumbnail frame:`, frameError);
            }
          }
          return texts;
        }
        
        // Extract frames from video buffer and use Cloud Vision API
        const { extractFramesFromVideoBuffer } = await import("@/lib/processing/media");
        
        try {
          const frames = await extractFramesFromVideoBuffer(contentItem.mediaUrl, 5);
          // ... process frames ...
        } catch (error: any) {
          console.error("[OCR] Frame extraction failed:", error.message);
          return texts;
        }
        */
      }
      return [];
    });

    // Step 4: Extract visual features (embeddings, hash, colors) - MANDATORY
    await step.run("extract-visual-features", async () => {
      const imageUrl = contentItem.thumbnailUrl || contentItem.mediaUrl;
      if (!imageUrl) {
        throw new Error("No image URL available for visual feature extraction");
      }

      // MANDATORY: All visual features must be extracted
      const [embedding, pHash, dominantColors] = await Promise.all([
        generateVisualEmbedding(imageUrl),
        calculatePerceptualHash(imageUrl),
        extractDominantColors(imageUrl),
      ]);

      try {
        if (prisma) {
          await prisma.contentVisualFeature.create({
            data: {
              contentItemId: contentItem.id,
              embedding: JSON.stringify(embedding), // Store as JSON string
              dominantColors: dominantColors.map(c => c.hex),
            },
          });
          await prisma.contentSimilarityHash.create({
            data: {
              contentItemId: contentItem.id,
              hashValue: pHash,
              hashType: "pHash",
            },
          });
        } else if (supabase) {
          const featureId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
          await supabase.from("ContentVisualFeature").insert({
            id: featureId,
            contentItemId: contentItem.id,
            embedding: JSON.stringify(embedding), // Store as JSON string
            dominantColors: dominantColors.map(c => c.hex),
            createdAt: new Date().toISOString(),
          });
          const hashId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
          await supabase.from("ContentSimilarityHash").insert({
            id: hashId,
            contentItemId: contentItem.id,
            hashValue: pHash,
            hashType: "pHash",
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error: any) {
        // MANDATORY: Throw error so Inngest retries
        throw new Error(`Visual feature extraction failed: ${error.message}`);
      }
    });

    // Step 5: Detect brand content
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

    // Step 6: Calculate ACCS score
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

