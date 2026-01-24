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

