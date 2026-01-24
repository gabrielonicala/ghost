import { detectPlatform, isDirectMediaUrl } from "./detector";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  YouTubeAdapter,
} from "./youtube";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface VideoDownloadResult {
  videoBuffer?: Buffer;
  audioBuffer?: Buffer;
  thumbnailBuffer?: Buffer;
  thumbnailUrl?: string;
  captions?: {
    text: string;
    language: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    duration?: number;
    viewCount?: number;
  };
  error?: string;
}

/**
 * Download video content from various platforms
 *
 * Strategy:
 * - YouTube: Use API for metadata + captions, thumbnail for visuals
 * - Direct URLs: Download directly
 * - Other platforms: Will need Apify or yt-dlp in the future
 */
export async function downloadVideo(
  url: string
): Promise<VideoDownloadResult> {
  // Check if it's a direct media URL
  if (isDirectMediaUrl(url)) {
    return downloadDirectUrl(url);
  }

  // Detect platform
  const platformInfo = detectPlatform(url);

  if (!platformInfo) {
    return {
      error: "Could not detect platform from URL. Please provide a direct video URL or a supported platform URL (YouTube, TikTok, Instagram, Facebook).",
    };
  }

  switch (platformInfo.platform) {
    case "youtube":
      return downloadYouTubeVideo(url);

    case "tiktok":
      return {
        error:
          "TikTok videos require additional setup (Apify or yt-dlp). " +
          "For now, please download the video manually and upload it to a direct URL, " +
          "or use YouTube which is fully supported.",
      };

    case "instagram":
      return {
        error:
          "Instagram videos require additional setup (Meta API or Apify). " +
          "For now, please download the video manually and upload it to a direct URL, " +
          "or use YouTube which is fully supported.",
      };

    case "facebook":
      return {
        error:
          "Facebook videos require additional setup (Meta API or Apify). " +
          "For now, please download the video manually and upload it to a direct URL, " +
          "or use YouTube which is fully supported.",
      };

    default:
      return {
        error: `Platform '${platformInfo.platform}' is not yet supported for video download.`,
      };
  }
}

/**
 * Download video from direct URL
 */
async function downloadDirectUrl(url: string): Promise<VideoDownloadResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return {
        error: `Failed to download: ${response.status} ${response.statusText}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check content type
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("video")) {
      return {
        videoBuffer: buffer,
      };
    } else if (contentType.includes("audio")) {
      return {
        audioBuffer: buffer,
      };
    } else if (contentType.includes("image")) {
      return {
        thumbnailBuffer: buffer,
      };
    }

    // Default to video
    return {
      videoBuffer: buffer,
    };
  } catch (error: any) {
    return {
      error: `Download failed: ${error.message}`,
    };
  }
}

/**
 * Download YouTube video content
 *
 * YouTube Data API provides:
 * - Metadata (title, description, duration, views)
 * - Thumbnail URLs
 * - Captions (if enabled and available)
 *
 * It does NOT provide:
 * - Direct video download URLs
 *
 * For video files, you'd need yt-dlp or similar.
 * For our use case (OCR + transcription):
 * - Use thumbnail for OCR
 * - Use captions API for transcript (if available)
 * - Or use Whisper on audio if captions not available
 */
async function downloadYouTubeVideo(url: string): Promise<VideoDownloadResult> {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return {
      error: "Could not extract video ID from YouTube URL",
    };
  }

  try {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      // Fallback: just return thumbnail URL
      return {
        thumbnailUrl: getYouTubeThumbnailUrl(videoId, "maxres"),
        metadata: {
          title: "Unknown (API key not configured)",
        },
      };
    }

    // Fetch video metadata
    const adapter = new YouTubeAdapter();
    const content = await adapter.fetchContent(videoId);

    if (!content) {
      return {
        error: "Video not found or is private/unavailable",
      };
    }

    // Get thumbnail
    const thumbnailUrl = content.thumbnailUrl || getYouTubeThumbnailUrl(videoId, "maxres");
    let thumbnailBuffer: Buffer | undefined;

    try {
      const thumbResponse = await fetch(thumbnailUrl);
      if (thumbResponse.ok) {
        const arrayBuffer = await thumbResponse.arrayBuffer();
        thumbnailBuffer = Buffer.from(arrayBuffer);
      }
    } catch {
      // Thumbnail download failed, continue without it
    }

    // Try to get captions
    let captions: { text: string; language: string } | undefined;

    try {
      captions = await fetchYouTubeCaptions(videoId, apiKey);
    } catch {
      // Captions not available or failed
    }

    // Parse title and description from caption
    const titleMatch = content.caption?.match(/^(.+?)\n/);
    const title = titleMatch?.[1] || "Untitled";
    const description = content.caption?.replace(titleMatch?.[0] || "", "") || "";

    return {
      thumbnailBuffer,
      thumbnailUrl,
      captions,
      metadata: {
        title,
        description,
        viewCount: content.metrics?.views,
      },
    };
  } catch (error: any) {
    return {
      error: `YouTube download failed: ${error.message}`,
    };
  }
}

/**
 * Fetch YouTube captions/subtitles
 *
 * Note: YouTube API v3 caption download requires OAuth2 authentication
 * (not just API key) for actual caption content.
 *
 * Alternative approaches:
 * 1. Use youtube-transcript library (unofficial)
 * 2. Scrape captions from video page
 * 3. Use yt-dlp to download subtitles
 *
 * For now, we'll try the unofficial approach which often works.
 */
async function fetchYouTubeCaptions(
  videoId: string,
  apiKey: string
): Promise<{ text: string; language: string } | undefined> {
  try {
    // Try unofficial transcript endpoint
    // This is a common workaround since official API requires OAuth
    const transcriptUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;

    const response = await fetch(transcriptUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      // Try auto-generated captions
      const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=json3`;
      const autoResponse = await fetch(autoUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!autoResponse.ok) {
        return undefined;
      }

      const autoData = await autoResponse.json();
      const text = extractTextFromCaptionData(autoData);
      return text ? { text, language: "en" } : undefined;
    }

    const data = await response.json();
    const text = extractTextFromCaptionData(data);
    return text ? { text, language: "en" } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract plain text from YouTube caption JSON format
 */
function extractTextFromCaptionData(data: any): string | null {
  try {
    if (data.events) {
      // json3 format
      const segments = data.events
        .filter((e: any) => e.segs)
        .flatMap((e: any) => e.segs)
        .map((s: any) => s.utf8)
        .filter(Boolean);

      return segments.join(" ").replace(/\s+/g, " ").trim();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a platform requires external tools (Apify, yt-dlp)
 */
export function requiresExternalDownload(url: string): boolean {
  const platformInfo = detectPlatform(url);

  if (!platformInfo) {
    return false;
  }

  // These platforms require external tools for video download
  return ["tiktok", "instagram", "facebook"].includes(platformInfo.platform);
}

/**
 * Get download instructions for unsupported platforms
 */
export function getDownloadInstructions(url: string): string {
  const platformInfo = detectPlatform(url);

  if (!platformInfo) {
    return "Unsupported URL format. Please provide a direct video URL or a URL from YouTube, TikTok, Instagram, or Facebook.";
  }

  const instructions: Record<string, string> = {
    tiktok:
      "TikTok: Download the video using the TikTok app (Save Video option) or a third-party downloader, then upload to a cloud storage service (e.g., Cloudinary, AWS S3) and provide the direct URL.",
    instagram:
      "Instagram: Download the Reel/video using the Instagram app or a third-party tool, then upload to cloud storage and provide the direct URL.",
    facebook:
      "Facebook: Download the video from Facebook (click ⋯ → Download video) then upload to cloud storage and provide the direct URL.",
    youtube:
      "YouTube is fully supported! Just paste the YouTube URL directly.",
    twitter:
      "Twitter/X: Download the video using a Twitter video downloader, then upload to cloud storage and provide the direct URL.",
  };

  return instructions[platformInfo.platform] || "Platform not supported.";
}

