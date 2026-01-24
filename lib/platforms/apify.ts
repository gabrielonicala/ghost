/**
 * Apify Integration for Video Downloading
 * 
 * Supports:
 * - TikTok (clockworks/tiktok-scraper)
 * - Instagram (apify/instagram-scraper)
 * - Facebook (apify/facebook-posts-scraper)
 * - YouTube (streamers/youtube-scraper) - for videos without captions
 */

const APIFY_API_BASE = "https://api.apify.com/v2";

export interface ApifyVideoResult {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  author?: {
    username: string;
    displayName?: string;
    profileUrl?: string;
  };
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  duration?: number;
  publishedAt?: Date;
}

interface ApifyRunResult {
  id: string;
  status: string;
  defaultDatasetId: string;
}

/**
 * Check if Apify is configured
 */
export function isApifyConfigured(): boolean {
  return !!process.env.APIFY_API_TOKEN;
}

/**
 * Get the appropriate Apify actor for a platform
 * Note: Actor IDs use ~ instead of / in API URLs
 */
function getActorId(platform: string): string {
  // Actor IDs for API calls use ~ instead of /
  const actors: Record<string, string> = {
    tiktok: "clockworks~tiktok-scraper",
    instagram: "apify~instagram-scraper",
    facebook: "apify~facebook-posts-scraper",
    youtube: "streamers~youtube-scraper",
  };

  const actorId = actors[platform];
  if (!actorId) {
    throw new Error(`No Apify actor configured for platform: ${platform}`);
  }

  return actorId;
}

/**
 * Run an Apify actor and wait for results
 */
async function runActor(
  actorId: string,
  input: Record<string, any>,
  timeoutMs: number = 120000 // 2 minutes
): Promise<any[]> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  // Start the actor run
  const runResponse = await fetch(
    `${APIFY_API_BASE}/acts/${actorId}/runs?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!runResponse.ok) {
    const error = await runResponse.text();
    throw new Error(`Failed to start Apify actor: ${error}`);
  }

  const runData: { data: ApifyRunResult } = await runResponse.json();
  const runId = runData.data.id;

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const statusResponse = await fetch(
      `${APIFY_API_BASE}/actor-runs/${runId}?token=${apiToken}`
    );

    if (!statusResponse.ok) {
      throw new Error("Failed to check actor run status");
    }

    const statusData: { data: ApifyRunResult } = await statusResponse.json();

    if (statusData.data.status === "SUCCEEDED") {
      // Fetch results from dataset
      const datasetId = statusData.data.defaultDatasetId;
      const dataResponse = await fetch(
        `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${apiToken}`
      );

      if (!dataResponse.ok) {
        throw new Error("Failed to fetch actor results");
      }

      return await dataResponse.json();
    }

    if (statusData.data.status === "FAILED" || statusData.data.status === "ABORTED") {
      throw new Error(`Apify actor run ${statusData.data.status}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Apify actor run timed out");
}

/**
 * Download TikTok video using Apify
 */
export async function downloadTikTokVideo(
  url: string
): Promise<ApifyVideoResult | null> {
  const results = await runActor("clockworks~tiktok-scraper", {
    postURLs: [url],
    resultsPerPage: 1,
    shouldDownloadVideos: false, // We just need the URL
    shouldDownloadCovers: false,
  });

  if (!results || results.length === 0) {
    return null;
  }

  const video = results[0];

  return {
    videoUrl: video.videoUrl || video.video?.downloadAddr || video.video?.playAddr,
    thumbnailUrl: video.coverUrl || video.video?.cover,
    caption: video.text || video.desc,
    author: {
      username: video.authorMeta?.name || video.author?.uniqueId,
      displayName: video.authorMeta?.nickName || video.author?.nickname,
      profileUrl: video.authorMeta?.profileUrl,
    },
    metrics: {
      views: video.playCount || video.stats?.playCount,
      likes: video.diggCount || video.stats?.diggCount,
      comments: video.commentCount || video.stats?.commentCount,
      shares: video.shareCount || video.stats?.shareCount,
    },
    duration: video.videoMeta?.duration || video.video?.duration,
    publishedAt: video.createTime ? new Date(video.createTime * 1000) : undefined,
  };
}

/**
 * Download Instagram video/reel using Apify
 */
export async function downloadInstagramVideo(
  url: string
): Promise<ApifyVideoResult | null> {
  const results = await runActor("apify~instagram-scraper", {
    directUrls: [url],
    resultsType: "posts",
    resultsLimit: 1,
  });

  if (!results || results.length === 0) {
    return null;
  }

  const post = results[0];

  // Instagram can have multiple media items
  const videoUrl = post.videoUrl || post.displayUrl;

  if (!videoUrl) {
    return null;
  }

  return {
    videoUrl,
    thumbnailUrl: post.displayUrl,
    caption: post.caption,
    author: {
      username: post.ownerUsername,
      displayName: post.ownerFullName,
    },
    metrics: {
      views: post.videoViewCount,
      likes: post.likesCount,
      comments: post.commentsCount,
    },
    publishedAt: post.timestamp ? new Date(post.timestamp) : undefined,
  };
}

/**
 * Download Facebook video using Apify
 */
export async function downloadFacebookVideo(
  url: string
): Promise<ApifyVideoResult | null> {
  const results = await runActor("apify~facebook-posts-scraper", {
    startUrls: [{ url }],
    resultsLimit: 1,
    includeVideoTranscript: true,
  });

  if (!results || results.length === 0) {
    return null;
  }

  const post = results[0];

  // Facebook video URL might be in different places
  const videoUrl = post.videoUrl || post.media?.[0]?.url;

  if (!videoUrl) {
    return null;
  }

  return {
    videoUrl,
    thumbnailUrl: post.media?.[0]?.thumbnail,
    caption: post.text,
    author: {
      username: post.pageName || post.userName,
      displayName: post.pageName || post.userName,
      profileUrl: post.pageUrl || post.userUrl,
    },
    metrics: {
      views: post.videoViewCount,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
    },
    publishedAt: post.time ? new Date(post.time) : undefined,
  };
}

/**
 * Download YouTube video using Apify (for videos without captions)
 */
export async function downloadYouTubeVideo(
  url: string
): Promise<ApifyVideoResult | null> {
  const results = await runActor("streamers~youtube-scraper", {
    startUrls: [{ url }],
    maxResults: 1,
    maxResultsShorts: 0,
    // Note: This actor provides metadata, not direct download URLs
    // You'll still need to use the video URL it provides
  });

  if (!results || results.length === 0) {
    return null;
  }

  const video = results[0];

  return {
    videoUrl: video.url || url,
    thumbnailUrl: video.thumbnailUrl,
    caption: `${video.title}\n\n${video.text || video.description || ""}`,
    author: {
      username: video.channelName || video.channelUrl?.split("/").pop(),
      displayName: video.channelName,
      profileUrl: video.channelUrl,
    },
    metrics: {
      views: video.viewCount,
      likes: video.likes,
      comments: video.commentsCount,
    },
    duration: video.duration,
    publishedAt: video.date ? new Date(video.date) : undefined,
  };
}

/**
 * Download video from any supported platform using Apify
 */
export async function downloadVideoWithApify(
  url: string,
  platform: "tiktok" | "instagram" | "facebook" | "youtube"
): Promise<ApifyVideoResult | null> {
  if (!isApifyConfigured()) {
    throw new Error(
      "Apify is not configured. Please add APIFY_API_TOKEN to your environment variables."
    );
  }

  switch (platform) {
    case "tiktok":
      return downloadTikTokVideo(url);
    case "instagram":
      return downloadInstagramVideo(url);
    case "facebook":
      return downloadFacebookVideo(url);
    case "youtube":
      return downloadYouTubeVideo(url);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Download the actual video file from the URL returned by Apify
 */
export async function downloadVideoFile(videoUrl: string): Promise<Buffer> {
  const response = await fetch(videoUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

