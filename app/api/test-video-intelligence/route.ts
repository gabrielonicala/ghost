import { NextRequest, NextResponse } from "next/server";
import { extractTextFromVideo, isVideoIntelligenceAvailable } from "@/lib/processing/video-intelligence";

/**
 * Direct test endpoint for Video Intelligence API
 * Bypasses Inngest so we can see logs directly
 * 
 * Usage: POST /api/test-video-intelligence
 * Body: { videoUrl: "https://..." } or { videoBuffer: "base64..." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, videoBufferBase64, tiktokUrl } = body;

    console.log("=".repeat(80));
    console.log("[TEST] Video Intelligence Test Endpoint");
    console.log("[TEST] Video Intelligence available:", isVideoIntelligenceAvailable());
    console.log("[TEST] Has videoUrl:", !!videoUrl);
    console.log("[TEST] Has videoBufferBase64:", !!videoBufferBase64);
    console.log("[TEST] Has tiktokUrl:", !!tiktokUrl);
    console.log("=".repeat(80));

    if (!videoUrl && !videoBufferBase64 && !tiktokUrl) {
      return NextResponse.json(
        { error: "Provide either videoUrl, videoBufferBase64, or tiktokUrl" },
        { status: 400 }
      );
    }

    let videoBuffer: Buffer | undefined;
    let finalVideoUrl: string | undefined = videoUrl;

    // If TikTok URL provided, download via Apify first
    if (tiktokUrl) {
      console.log("[TEST] TikTok URL provided, downloading via Apify...");
      const { downloadVideoWithApify, isApifyConfigured } = await import("@/lib/platforms/apify");
      
      if (!isApifyConfigured()) {
        return NextResponse.json(
          { error: "Apify not configured. Set APIFY_API_TOKEN in .env" },
          { status: 400 }
        );
      }

      const apifyResult = await downloadVideoWithApify(tiktokUrl, "tiktok");
      if (!apifyResult?.videoUrl) {
        return NextResponse.json(
          { error: "Failed to get video URL from Apify" },
          { status: 500 }
        );
      }

      console.log("[TEST] Got Apify video URL:", apifyResult.videoUrl);
      finalVideoUrl = apifyResult.videoUrl;
    }

    if (videoBufferBase64) {
      videoBuffer = Buffer.from(videoBufferBase64, "base64");
      console.log("[TEST] Using base64 buffer, size:", videoBuffer.length);
    } else if (finalVideoUrl && !finalVideoUrl.startsWith("gs://")) {
      // Download video if we have a URL (not GCS)
      console.log("[TEST] Downloading video from URL:", finalVideoUrl);
      const response = await fetch(finalVideoUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuffer);
        console.log("[TEST] Downloaded video, size:", videoBuffer.length, "bytes");
      } else {
        return NextResponse.json(
          { error: `Failed to download video: ${response.status} ${response.statusText}` },
          { status: 500 }
        );
      }
    }

    if (!videoBuffer && !finalVideoUrl) {
      return NextResponse.json(
        { error: "Could not get video buffer or URL" },
        { status: 400 }
      );
    }

    console.log("[TEST] Calling extractTextFromVideo...");
    console.log("[TEST] Using:", videoBuffer ? `buffer (${videoBuffer.length} bytes)` : `URL (${finalVideoUrl})`);
    const result = await extractTextFromVideo(finalVideoUrl, videoBuffer);

    console.log("[TEST] Result:", {
      textCount: result.texts.length,
      fullTextLength: result.fullText.length,
      fullText: result.fullText.slice(0, 500),
      texts: result.texts.slice(0, 5),
    });

    return NextResponse.json({
      success: true,
      result: {
        textCount: result.texts.length,
        fullTextLength: result.fullText.length,
        fullText: result.fullText,
        texts: result.texts,
      },
    });
  } catch (error: any) {
    console.error("[TEST] Video Intelligence test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if Video Intelligence is configured
 */
export async function GET() {
  return NextResponse.json({
    available: isVideoIntelligenceAvailable(),
    hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  });
}
