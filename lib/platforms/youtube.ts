import type { PlatformContent, PlatformAdapter } from "@/lib/ingestion/platform-adapters";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      publishedAt: string;
      channelId: string;
      title: string;
      description: string;
      thumbnails: {
        default?: { url: string; width: number; height: number };
        medium?: { url: string; width: number; height: number };
        high?: { url: string; width: number; height: number };
        standard?: { url: string; width: number; height: number };
        maxres?: { url: string; width: number; height: number };
      };
      channelTitle: string;
      tags?: string[];
      categoryId: string;
      liveBroadcastContent: string;
    };
    contentDetails: {
      duration: string; // ISO 8601 duration
      dimension: string;
      definition: string;
      caption: string;
      licensedContent: boolean;
      projection: string;
    };
    statistics: {
      viewCount: string;
      likeCount?: string;
      dislikeCount?: string;
      favoriteCount: string;
      commentCount?: string;
    };
  }>;
}

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
      };
    };
    statistics: {
      viewCount: string;
      subscriberCount: string;
      hiddenSubscriberCount: boolean;
      videoCount: string;
    };
  }>;
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      kind: string;
      videoId: string;
    };
    snippet: {
      publishedAt: string;
      channelId: string;
      title: string;
      description: string;
      thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
      };
      channelTitle: string;
    };
  }>;
  nextPageToken?: string;
}

/**
 * YouTube Data API v3 Adapter
 * 
 * Uses the YouTube Data API to fetch video metadata.
 * Note: The API provides metadata but NOT direct video download URLs.
 * For actual video download, we use yt-dlp or thumbnail-based processing.
 */
export class YouTubeAdapter implements PlatformAdapter {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_CLOUD_API_KEY is required for YouTube integration"
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch video metadata by video ID (or URL)
   */
  async fetchContent(videoIdOrUrl: string): Promise<PlatformContent | null> {
    try {
      // Accept either a raw videoId or a full YouTube/Shorts URL
      let videoId = videoIdOrUrl.trim();
      if (/^https?:\/\//i.test(videoId)) {
        const extracted = extractYouTubeVideoId(videoId);
        if (!extracted) {
          throw new Error("Could not extract YouTube video ID from URL");
        }
        videoId = extracted;
      }

      // Fetch video details
      const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
      videoUrl.searchParams.set("part", "snippet,contentDetails,statistics");
      videoUrl.searchParams.set("id", videoId);
      videoUrl.searchParams.set("key", this.apiKey);

      const videoResponse = await fetch(videoUrl.toString());

      if (!videoResponse.ok) {
        const error = await videoResponse.json();
        throw new Error(
          `YouTube API error: ${error.error?.message || videoResponse.statusText}`
        );
      }

      const videoData: YouTubeVideoResponse = await videoResponse.json();

      if (!videoData.items || videoData.items.length === 0) {
        return null;
      }

      const video = videoData.items[0];

      // Fetch channel details for more creator info
      const channelData = await this.fetchChannelInfo(video.snippet.channelId);

      return this.normalizeContent({ video, channel: channelData });
    } catch (error: any) {
      console.error("YouTube fetchContent error:", error.message);
      throw error;
    }
  }

  /**
   * Fetch channel information
   */
  private async fetchChannelInfo(
    channelId: string
  ): Promise<YouTubeChannelResponse["items"][0] | null> {
    try {
      const channelUrl = new URL(`${YOUTUBE_API_BASE}/channels`);
      channelUrl.searchParams.set("part", "snippet,statistics");
      channelUrl.searchParams.set("id", channelId);
      channelUrl.searchParams.set("key", this.apiKey);

      const response = await fetch(channelUrl.toString());

      if (!response.ok) {
        return null;
      }

      const data: YouTubeChannelResponse = await response.json();
      return data.items?.[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch videos from a channel
   */
  async fetchCreatorContent(
    channelId: string,
    limit: number = 50
  ): Promise<PlatformContent[]> {
    try {
      const results: PlatformContent[] = [];
      let pageToken: string | undefined;

      while (results.length < limit) {
        const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("channelId", channelId);
        searchUrl.searchParams.set("type", "video");
        searchUrl.searchParams.set("order", "date");
        searchUrl.searchParams.set(
          "maxResults",
          String(Math.min(50, limit - results.length))
        );
        searchUrl.searchParams.set("key", this.apiKey);

        if (pageToken) {
          searchUrl.searchParams.set("pageToken", pageToken);
        }

        const response = await fetch(searchUrl.toString());

        if (!response.ok) {
          break;
        }

        const data: YouTubeSearchResponse = await response.json();

        if (!data.items || data.items.length === 0) {
          break;
        }

        // Fetch full video details for each video
        const videoIds = data.items.map((item) => item.id.videoId);
        const videos = await this.fetchMultipleVideos(videoIds);

        results.push(...videos);

        if (!data.nextPageToken || results.length >= limit) {
          break;
        }

        pageToken = data.nextPageToken;
      }

      return results.slice(0, limit);
    } catch (error: any) {
      console.error("YouTube fetchCreatorContent error:", error.message);
      throw error;
    }
  }

  /**
   * Fetch multiple videos at once (more efficient)
   */
  private async fetchMultipleVideos(
    videoIds: string[]
  ): Promise<PlatformContent[]> {
    if (videoIds.length === 0) return [];

    try {
      const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
      videoUrl.searchParams.set("part", "snippet,contentDetails,statistics");
      videoUrl.searchParams.set("id", videoIds.join(","));
      videoUrl.searchParams.set("key", this.apiKey);

      const response = await fetch(videoUrl.toString());

      if (!response.ok) {
        return [];
      }

      const data: YouTubeVideoResponse = await response.json();

      return Promise.all(
        data.items.map(async (video) => {
          const channel = await this.fetchChannelInfo(video.snippet.channelId);
          return this.normalizeContent({ video, channel });
        })
      );
    } catch {
      return [];
    }
  }

  /**
   * Normalize YouTube API response to PlatformContent
   */
  normalizeContent(raw: {
    video: YouTubeVideoResponse["items"][0];
    channel: YouTubeChannelResponse["items"][0] | null;
  }): PlatformContent {
    const { video, channel } = raw;

    // Get best available thumbnail
    const thumbnails = video.snippet.thumbnails;
    const thumbnailUrl =
      thumbnails.maxres?.url ||
      thumbnails.standard?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      "";

    // Determine content type based on duration
    const duration = parseDuration(video.contentDetails.duration);
    const isShort = duration <= 60; // YouTube Shorts are <= 60 seconds

    return {
      platform: "youtube",
      platformContentId: video.id,
      contentType: isShort ? "reel" : "video", // Map Shorts to "reel"
      mediaUrl: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnailUrl,
      caption: `${video.snippet.title}\n\n${video.snippet.description}`,
      publishedAt: new Date(video.snippet.publishedAt),
      creator: {
        platformId: video.snippet.channelId,
        username: channel?.snippet?.customUrl || video.snippet.channelTitle,
        displayName: video.snippet.channelTitle,
        profileImageUrl: channel?.snippet?.thumbnails?.high?.url,
        followerCount: channel?.statistics
          ? parseInt(channel.statistics.subscriberCount, 10)
          : undefined,
        verified: undefined, // YouTube API doesn't expose verification status easily
      },
      metrics: {
        views: parseInt(video.statistics.viewCount, 10),
        likes: video.statistics.likeCount
          ? parseInt(video.statistics.likeCount, 10)
          : undefined,
        comments: video.statistics.commentCount
          ? parseInt(video.statistics.commentCount, 10)
          : undefined,
      },
    };
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * Examples: PT1M30S (90 seconds), PT2H30M (9000 seconds)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1).split("/")[0] || null;
    }

    // youtube.com/shorts/VIDEO_ID
    if (urlObj.pathname.startsWith("/shorts/")) {
      return urlObj.pathname.split("/shorts/")[1]?.split(/[?&#]/)[0] || null;
    }

    // youtube.com/embed/VIDEO_ID
    if (urlObj.pathname.startsWith("/embed/")) {
      return urlObj.pathname.split("/embed/")[1]?.split(/[?&#]/)[0] || null;
    }

    // youtube.com/watch?v=VIDEO_ID
    return urlObj.searchParams.get("v");
  } catch {
    // Regex fallback
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match?.[1] || null;
  }
}

/**
 * Get YouTube thumbnail URL for a video ID
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: "default" | "medium" | "high" | "standard" | "maxres" = "maxres"
): string {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    standard: "sddefault",
    maxres: "maxresdefault",
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Get YouTube video embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get YouTube video watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

