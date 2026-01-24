import type { Platform } from "@/lib/types";

export interface PlatformInfo {
  platform: Platform;
  contentId: string | null;
  isShort: boolean; // YouTube Shorts, TikTok, Reels
  originalUrl: string;
}

/**
 * Detect platform from URL and extract content ID
 */
export function detectPlatform(url: string): PlatformInfo | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return parseYouTubeUrl(url);
    }

    // TikTok
    if (hostname.includes("tiktok.com")) {
      return parseTikTokUrl(url);
    }

    // Instagram
    if (hostname.includes("instagram.com")) {
      return parseInstagramUrl(url);
    }

    // Facebook
    if (hostname.includes("facebook.com") || hostname.includes("fb.watch")) {
      return parseFacebookUrl(url);
    }

    // Twitter/X
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return parseTwitterUrl(url);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse YouTube URLs
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 */
function parseYouTubeUrl(url: string): PlatformInfo {
  let videoId: string | null = null;
  let isShort = false;

  try {
    const urlObj = new URL(url);

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1).split("/")[0];
    }
    // youtube.com/shorts/VIDEO_ID
    else if (urlObj.pathname.startsWith("/shorts/")) {
      videoId = urlObj.pathname.split("/shorts/")[1]?.split(/[?&#]/)[0] || null;
      isShort = true;
    }
    // youtube.com/embed/VIDEO_ID
    else if (urlObj.pathname.startsWith("/embed/")) {
      videoId = urlObj.pathname.split("/embed/")[1]?.split(/[?&#]/)[0] || null;
    }
    // youtube.com/watch?v=VIDEO_ID
    else {
      videoId = urlObj.searchParams.get("v");
    }
  } catch {
    // Try regex fallback
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    videoId = match?.[1] || null;
  }

  return {
    platform: "youtube",
    contentId: videoId,
    isShort,
    originalUrl: url,
  };
}

/**
 * Parse TikTok URLs
 * Supports:
 * - tiktok.com/@username/video/VIDEO_ID
 * - vm.tiktok.com/SHORT_CODE
 * - tiktok.com/t/SHORT_CODE
 */
function parseTikTokUrl(url: string): PlatformInfo {
  let videoId: string | null = null;

  try {
    const urlObj = new URL(url);

    // tiktok.com/@username/video/VIDEO_ID
    const videoMatch = urlObj.pathname.match(/\/video\/(\d+)/);
    if (videoMatch) {
      videoId = videoMatch[1];
    }
    // Short URLs - we can't extract ID directly, need to resolve
    else if (
      urlObj.hostname === "vm.tiktok.com" ||
      urlObj.pathname.startsWith("/t/")
    ) {
      // For short URLs, we'll need to resolve them later
      videoId = null;
    }
  } catch {
    // Fallback regex
    const match = url.match(/\/video\/(\d+)/);
    videoId = match?.[1] || null;
  }

  return {
    platform: "tiktok",
    contentId: videoId,
    isShort: true, // All TikTok videos are short-form
    originalUrl: url,
  };
}

/**
 * Parse Instagram URLs
 * Supports:
 * - instagram.com/p/POST_ID
 * - instagram.com/reel/REEL_ID
 * - instagram.com/reels/REEL_ID
 * - instagram.com/tv/VIDEO_ID
 */
function parseInstagramUrl(url: string): PlatformInfo {
  let contentId: string | null = null;
  let isShort = false;

  try {
    const urlObj = new URL(url);

    // /reel/ or /reels/
    const reelMatch = urlObj.pathname.match(/\/reels?\/([A-Za-z0-9_-]+)/);
    if (reelMatch) {
      contentId = reelMatch[1];
      isShort = true;
    }
    // /p/ (post)
    else {
      const postMatch = urlObj.pathname.match(/\/p\/([A-Za-z0-9_-]+)/);
      if (postMatch) {
        contentId = postMatch[1];
      }
      // /tv/ (IGTV)
      else {
        const tvMatch = urlObj.pathname.match(/\/tv\/([A-Za-z0-9_-]+)/);
        if (tvMatch) {
          contentId = tvMatch[1];
        }
      }
    }
  } catch {
    // Fallback
    const match = url.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    contentId = match?.[2] || null;
    isShort = match?.[1] === "reel" || match?.[1] === "reels";
  }

  return {
    platform: "instagram",
    contentId,
    isShort,
    originalUrl: url,
  };
}

/**
 * Parse Facebook URLs
 * Supports:
 * - facebook.com/watch?v=VIDEO_ID
 * - facebook.com/username/videos/VIDEO_ID
 * - fb.watch/SHORT_CODE
 */
function parseFacebookUrl(url: string): PlatformInfo {
  let videoId: string | null = null;

  try {
    const urlObj = new URL(url);

    // fb.watch short URLs
    if (urlObj.hostname === "fb.watch") {
      // Need to resolve these
      videoId = null;
    }
    // facebook.com/watch?v=VIDEO_ID
    else if (urlObj.pathname === "/watch" || urlObj.pathname === "/watch/") {
      videoId = urlObj.searchParams.get("v");
    }
    // facebook.com/username/videos/VIDEO_ID
    else {
      const videosMatch = urlObj.pathname.match(/\/videos\/(\d+)/);
      if (videosMatch) {
        videoId = videosMatch[1];
      }
    }
  } catch {
    const match = url.match(/\/videos\/(\d+)/);
    videoId = match?.[1] || null;
  }

  return {
    platform: "facebook",
    contentId: videoId,
    isShort: false,
    originalUrl: url,
  };
}

/**
 * Parse Twitter/X URLs
 * Supports:
 * - twitter.com/username/status/TWEET_ID
 * - x.com/username/status/TWEET_ID
 */
function parseTwitterUrl(url: string): PlatformInfo {
  let tweetId: string | null = null;

  try {
    const urlObj = new URL(url);
    const statusMatch = urlObj.pathname.match(/\/status\/(\d+)/);
    if (statusMatch) {
      tweetId = statusMatch[1];
    }
  } catch {
    const match = url.match(/\/status\/(\d+)/);
    tweetId = match?.[1] || null;
  }

  return {
    platform: "twitter",
    contentId: tweetId,
    isShort: false,
    originalUrl: url,
  };
}

/**
 * Check if URL is a direct media file (not a platform page)
 */
export function isDirectMediaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // Check for common video/image extensions
    const mediaExtensions = [
      ".mp4",
      ".webm",
      ".mov",
      ".avi",
      ".mkv",
      ".mp3",
      ".wav",
      ".ogg",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
    ];

    return mediaExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "Twitter/X",
  };
  return names[platform] || platform;
}

