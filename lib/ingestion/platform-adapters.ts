import type { Platform } from "@/lib/types";
import { YouTubeAdapter } from "@/lib/platforms/youtube";
import { downloadTikTokVideo, isApifyConfigured } from "@/lib/platforms/apify";

export interface PlatformContent {
  platform: Platform;
  platformContentId: string;
  contentType: "video" | "image" | "reel" | "post" | "story";
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  publishedAt: Date;
  creator: {
    platformId: string;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
    followerCount?: number;
    verified?: boolean;
  };
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
}

/**
 * Base platform adapter interface
 */
export interface PlatformAdapter {
  fetchContent(contentId: string): Promise<PlatformContent | null>;
  fetchCreatorContent(
    creatorId: string,
    limit?: number
  ): Promise<PlatformContent[]>;
  normalizeContent(raw: any): PlatformContent;
}

/**
 * Instagram adapter (placeholder - would integrate with Instagram API)
 */
export class InstagramAdapter implements PlatformAdapter {
  async fetchContent(contentId: string): Promise<PlatformContent | null> {
    // TODO: Implement Instagram API integration
    throw new Error("Instagram adapter not implemented");
  }

  async fetchCreatorContent(
    creatorId: string,
    limit: number = 50
  ): Promise<PlatformContent[]> {
    // TODO: Implement Instagram API integration
    throw new Error("Instagram adapter not implemented");
  }

  normalizeContent(raw: any): PlatformContent {
    return {
      platform: "instagram",
      platformContentId: raw.id,
      contentType: raw.media_type === "VIDEO" ? "video" : "image",
      mediaUrl: raw.media_url,
      thumbnailUrl: raw.thumbnail_url,
      caption: raw.caption,
      publishedAt: new Date(raw.timestamp),
      creator: {
        platformId: raw.creator.id,
        username: raw.creator.username,
        displayName: raw.creator.name,
        profileImageUrl: raw.creator.profile_picture_url,
        followerCount: raw.creator.follower_count,
        verified: raw.creator.is_verified,
      },
      metrics: {
        likes: raw.like_count,
        comments: raw.comments_count,
      },
    };
  }
}

/**
 * TikTok adapter (placeholder - would integrate with TikTok API)
 */
export class TikTokAdapter implements PlatformAdapter {
  async fetchContent(contentId: string): Promise<PlatformContent | null> {
    // We accept either a full TikTok URL or a bare video id.
    // Apify needs a URL, so if an id is provided we can't reliably build a URL (username is missing).
    const isUrl = /^https?:\/\//i.test(contentId);
    if (!isUrl) {
      throw new Error(
        "TikTok ingestion expects a full TikTok URL (not just the numeric id)."
      );
    }

    if (!isApifyConfigured()) {
      throw new Error("APIFY_API_TOKEN is not configured (required for TikTok).");
    }

    const result = await downloadTikTokVideo(contentId);
    if (!result?.videoUrl) return null;

    // Try to extract the TikTok video id for stable platformContentId
    const match = contentId.match(/\/video\/(\d+)/);
    const platformContentId = match?.[1] || contentId;

    return {
      platform: "tiktok",
      platformContentId,
      contentType: "video",
      // Keep the original TikTok URL as mediaUrl so downstream logic can re-fetch via Apify
      mediaUrl: contentId,
      thumbnailUrl: result.thumbnailUrl,
      caption: result.caption,
      publishedAt: result.publishedAt || new Date(),
      creator: {
        // Apify result doesn't currently provide a stable numeric creator id,
        // so we use username as platformId for now.
        platformId: result.author?.username || "unknown",
        username: result.author?.username || "unknown",
        displayName: result.author?.displayName,
        profileImageUrl: undefined,
        followerCount: undefined,
        verified: false,
      },
      metrics: {
        views: result.metrics?.views,
        likes: result.metrics?.likes,
        comments: result.metrics?.comments,
        shares: result.metrics?.shares,
      },
    };
  }

  async fetchCreatorContent(
    creatorId: string,
    limit: number = 50
  ): Promise<PlatformContent[]> {
    // TODO: Implement TikTok API integration
    throw new Error("TikTok adapter not implemented");
  }

  normalizeContent(raw: any): PlatformContent {
    return {
      platform: "tiktok",
      platformContentId: raw.id,
      contentType: "video",
      mediaUrl: raw.video_url,
      thumbnailUrl: raw.cover_image_url,
      caption: raw.description,
      publishedAt: new Date(raw.create_time * 1000),
      creator: {
        platformId: raw.creator.id,
        username: raw.creator.username,
        displayName: raw.creator.display_name,
        profileImageUrl: raw.creator.avatar_url,
        followerCount: raw.creator.follower_count,
        verified: raw.creator.is_verified,
      },
      metrics: {
        views: raw.view_count,
        likes: raw.like_count,
        comments: raw.comment_count,
        shares: raw.share_count,
      },
    };
  }
}

// YouTubeAdapter is imported from @/lib/platforms/youtube and re-exported
export { YouTubeAdapter };

/**
 * Factory to get the appropriate adapter
 */
export function getPlatformAdapter(platform: Platform): PlatformAdapter {
  switch (platform) {
    case "instagram":
      return new InstagramAdapter();
    case "tiktok":
      return new TikTokAdapter();
    case "youtube":
      return new YouTubeAdapter();
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

