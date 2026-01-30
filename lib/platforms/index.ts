// Platform utilities for video ingestion

export {
  detectPlatform,
  isDirectMediaUrl,
  getPlatformDisplayName,
  type PlatformInfo,
} from "./detector";

export {
  YouTubeAdapter,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
} from "./youtube";

export {
  downloadVideo,
  requiresExternalDownload,
  getDownloadInstructions,
  type VideoDownloadResult,
} from "./video-download";

export {
  isApifyConfigured,
  downloadVideoWithApify,
  downloadVideoFile,
  downloadTikTokVideo,
  downloadInstagramVideo,
  downloadFacebookVideo,
  downloadYouTubeVideo as downloadYouTubeVideoWithApify,
  // YouTube Apify scrapers
  fetchYouTubeTranscript,
  fetchYouTubeDirectVideoUrl,
  fetchYouTubeComments,
  processYouTubeWithApify,
  // Multi-platform transcript (TikTok, Instagram, Facebook, X)
  fetchVideoTranscript,
  type ApifyVideoResult,
  type YouTubeTranscriptResult,
  type YouTubeDownloadResult,
  type YouTubeComment,
  type YouTubeCommentsResult,
  type VideoTranscriptResult,
} from "./apify";

