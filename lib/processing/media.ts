import Tesseract from "tesseract.js";
import OpenAI from "openai";
import sharp from "sharp";
import {
  detectPlatform,
  isDirectMediaUrl,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  downloadVideo,
  isApifyConfigured,
  downloadVideoWithApify,
  downloadVideoFile,
  fetchYouTubeTranscript,
  fetchYouTubeDirectVideoUrl,
} from "@/lib/platforms";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Detect file type from buffer magic bytes
 * Returns filename with appropriate extension
 */
function detectFileTypeFromBuffer(buffer: Buffer): string {
  // Check first few bytes for common formats
  const header = buffer.slice(0, 12);
  
  // MP4/M4A - starts with ftyp at position 4
  if (header.length >= 8 && header.slice(4, 8).toString() === "ftyp") {
    return "video.mp4";
  }
  
  // WebM - starts with 0x1A45DFA3
  if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) {
    return "video.webm";
  }
  
  // MPEG audio (MP3) - starts with 0xFF 0xFB or ID3
  if ((header[0] === 0xff && header[1] === 0xfb) || header.slice(0, 3).toString() === "ID3") {
    return "audio.mp3";
  }
  
  // WAV - starts with RIFF
  if (header.slice(0, 4).toString() === "RIFF") {
    return "audio.wav";
  }
  
  // OGG - starts with OggS
  if (header.slice(0, 4).toString() === "OggS") {
    return "audio.ogg";
  }
  
  // FLAC - starts with fLaC
  if (header.slice(0, 4).toString() === "fLaC") {
    return "audio.flac";
  }
  
  // Default to MP4 (most common for video from social platforms)
  console.log("[detectFileType] Unknown format, defaulting to MP4. Header:", header.slice(0, 8).toString("hex"));
  return "video.mp4";
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/mp4",
    webm: "video/webm",
    mpeg: "video/mpeg",
    mp3: "audio/mpeg",
    mpga: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    flac: "audio/flac",
  };
  
  return mimeTypes[ext] || "video/mp4";
}

/**
 * Download a file from URL and return as Buffer
 * Handles various platforms with appropriate headers
 */
async function downloadFile(url: string): Promise<Buffer> {
  // Detect platform and set appropriate headers
  const headers: HeadersInit = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
  };

  // Add platform-specific headers
  if (url.includes("tiktok.com")) {
    headers["Referer"] = "https://www.tiktok.com/";
    headers["Origin"] = "https://www.tiktok.com";
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    headers["Referer"] = "https://www.youtube.com/";
  } else if (url.includes("instagram.com")) {
    headers["Referer"] = "https://www.instagram.com/";
  }

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      // Provide more helpful error messages
      if (response.status === 403) {
        throw new Error(
          `Access forbidden (403). This URL may be:\n` +
          `- A signed/authenticated URL that has expired\n` +
          `- Protected and requires authentication\n` +
          `- Blocked by the platform\n\n` +
          `For TikTok/Instagram/YouTube: Try using a direct video file URL or download the video first.`
        );
      }
      if (response.status === 404) {
        throw new Error(`File not found (404). The URL may be invalid or expired.`);
      }
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    // Re-throw with more context if it's already our custom error
    if (error.message.includes("Access forbidden") || error.message.includes("File not found")) {
      throw error;
    }
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Extract audio from video (for serverless - downloads video and extracts audio)
 * Note: In production, you might want to use a dedicated service for this
 */
export async function extractAudio(videoUrl: string): Promise<Buffer> {
  // For now, we'll use OpenAI Whisper API which can handle video URLs directly
  // If you need actual audio extraction, consider using a service like Cloudinary or AWS MediaConvert
  throw new Error(
    "Direct audio extraction not implemented. Use transcribeAudio with video URL instead."
  );
}

/**
 * Get video buffer using the SAME logic as transcription
 * This ensures OCR uses the exact same video that transcription processes
 */
async function getVideoBufferForOCR(
  videoUrl: string
): Promise<Buffer | null> {
  console.log("[getVideoBufferForOCR] Getting video buffer from:", videoUrl);
  
  // Use the SAME logic as transcription to get the video buffer
  const platformInfo = detectPlatform(videoUrl);
  
  // For TikTok/Instagram/Facebook, use Apify (same as transcription)
  if (platformInfo && ["tiktok", "instagram", "facebook"].includes(platformInfo.platform)) {
    if (isApifyConfigured()) {
      console.log(`[getVideoBufferForOCR] Using Apify for ${platformInfo.platform}`);
      const apifyResult = await downloadVideoWithApify(
        videoUrl,
        platformInfo.platform as "tiktok" | "instagram" | "facebook"
      );
      
      if (apifyResult?.videoUrl) {
        console.log("[getVideoBufferForOCR] Got Apify video URL, downloading...");
        const buffer = await downloadVideoFile(apifyResult.videoUrl);
        console.log("[getVideoBufferForOCR] Downloaded video:", buffer.length, "bytes");
        return buffer;
      }
    }
  } else if (isDirectMediaUrl(videoUrl)) {
    // Direct video URL - download directly
    console.log("[getVideoBufferForOCR] Direct URL, downloading...");
    return await downloadFile(videoUrl);
  } else {
    // Try downloading as-is
    try {
      return await downloadFile(videoUrl);
    } catch (error) {
      console.error("[getVideoBufferForOCR] Failed to download video:", error);
      return null;
    }
  }
  
  return null;
}

/**
 * Extract frames from video buffer for OCR using Cloud Vision API
 * Uses the same video download logic as transcription
 * 
 * @param videoUrl - Original platform URL (same as transcription uses)
 * @param frameCount - Number of frames to extract (default: 5)
 * @returns Array of frame images as data URLs
 */
export async function extractFramesFromVideoBuffer(
  videoUrl: string,
  frameCount: number = 5
): Promise<Array<{ index: number; imageUrl: string; timestamp: number }>> {
  console.log("[extractFramesFromVideoBuffer] Starting frame extraction from:", videoUrl);
  
  const videoBuffer = await getVideoBufferForOCR(videoUrl);
  
  if (!videoBuffer) {
    console.warn("[extractFramesFromVideoBuffer] Could not get video buffer");
    return [];
  }
  
  console.log("[extractFramesFromVideoBuffer] Video buffer obtained, size:", videoBuffer.length);
  
  // Extract frames using fluent-ffmpeg
  // Note: This requires FFmpeg to be installed on the system
  // For serverless, consider using @ffmpeg/ffmpeg (WebAssembly) or a cloud service
  try {
    const ffmpeg = (await import("fluent-ffmpeg")).default;
    const fs = await import("fs");
    const path = await import("path");
    const os = await import("os");
    
    // Create temporary files for input and output
    const inputPath = path.join(os.tmpdir(), `video-input-${Date.now()}.mp4`);
    const outputDir = path.join(os.tmpdir(), `frames-${Date.now()}`);
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Write video buffer to temp file
    fs.writeFileSync(inputPath, videoBuffer);
    
    // Extract frames at evenly spaced intervals
    return new Promise((resolve, reject) => {
      const frames: Array<{ index: number; imageUrl: string; timestamp: number }> = [];
      
      // Get video duration first
      ffmpeg.ffprobe(inputPath, (err: any, metadata: any) => {
        if (err) {
          console.error("[extractFramesFromVideoBuffer] Failed to probe video:", err);
          // Cleanup
          try { fs.unlinkSync(inputPath); } catch {}
          try { fs.rmSync(outputDir, { recursive: true }); } catch {}
          reject(err);
          return;
        }
        
        const duration = metadata.format.duration || 10; // Default to 10 seconds if unknown
        const interval = duration / (frameCount + 1); // Space frames evenly
        
        console.log(`[extractFramesFromVideoBuffer] Video duration: ${duration}s, extracting ${frameCount} frames`);
        
        // Extract frames
        ffmpeg(inputPath)
          .outputOptions([
            `-vf fps=1/${interval}`, // Extract 1 frame per interval
            `-frames:v ${frameCount}`, // Limit to frameCount frames
            `-q:v 2`, // High quality
          ])
          .output(path.join(outputDir, "frame-%03d.jpg"))
          .on("end", () => {
            // Read extracted frames and convert to data URLs
            const files = fs.readdirSync(outputDir).sort();
            
            files.forEach((file: string, index: number) => {
              const framePath = path.join(outputDir, file);
              const frameBuffer = fs.readFileSync(framePath);
              const base64 = frameBuffer.toString("base64");
              const dataUrl = `data:image/jpeg;base64,${base64}`;
              const timestamp = interval * (index + 1);
              
              frames.push({
                index,
                imageUrl: dataUrl,
                timestamp,
              });
              
              // Cleanup frame file
              try { fs.unlinkSync(framePath); } catch {}
            });
            
            // Cleanup
            try { fs.unlinkSync(inputPath); } catch {}
            try { fs.rmSync(outputDir, { recursive: true }); } catch {}
            
            console.log(`[extractFramesFromVideoBuffer] Extracted ${frames.length} frames`);
            resolve(frames);
          })
          .on("error", (err: any) => {
            console.error("[extractFramesFromVideoBuffer] FFmpeg error:", err);
            // Cleanup
            try { fs.unlinkSync(inputPath); } catch {}
            try { fs.rmSync(outputDir, { recursive: true }); } catch {}
            reject(err);
          })
          .run();
      });
    });
  } catch (error: any) {
    console.error("[extractFramesFromVideoBuffer] Frame extraction failed:", error.message);
    // If FFmpeg is not available, return empty array
    // The OCR will fall back to thumbnail-based extraction
    return [];
  }
}

/**
 * Extract frames from video for OCR (legacy method - uses thumbnails)
 * 
 * Uses platform-specific methods:
 * - YouTube: High-quality thumbnails via API
 * - Direct URLs: Download and process
 * - Other platforms: Thumbnail extraction where possible
 * 
 * Note: For full video frame extraction, consider Cloudinary, AWS MediaConvert, or FFmpeg
 */
export async function extractFrames(
  videoUrl: string,
  frameCount: number = 5
): Promise<Array<{ index: number; imageUrl: string }>> {
  try {
    // Detect platform
    const platformInfo = detectPlatform(videoUrl);
    
    let thumbnailUrl: string | null = null;
    let thumbnailBuffer: Buffer | null = null;
    
    // Platform-specific thumbnail extraction
    
    // For TikTok/Instagram/Facebook, try Apify first
    if (platformInfo && ["tiktok", "instagram", "facebook"].includes(platformInfo.platform)) {
      if (isApifyConfigured()) {
        try {
          const apifyResult = await downloadVideoWithApify(
            videoUrl,
            platformInfo.platform as "tiktok" | "instagram" | "facebook"
          );
          
          if (apifyResult?.thumbnailUrl) {
            const response = await fetch(apifyResult.thumbnailUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              thumbnailBuffer = Buffer.from(arrayBuffer);
              thumbnailUrl = apifyResult.thumbnailUrl;
            }
          }
        } catch {
          // Apify failed, continue to fallback
        }
      }
    }
    
    if (platformInfo?.platform === "youtube") {
      const videoId = extractYouTubeVideoId(videoUrl);
      if (videoId) {
        // Try different YouTube thumbnail qualities
        const qualities = ["maxresdefault", "sddefault", "hqdefault", "mqdefault"] as const;
        
        for (const quality of qualities) {
          const url = getYouTubeThumbnailUrl(videoId, quality === "maxresdefault" ? "maxres" : quality === "sddefault" ? "standard" : quality === "hqdefault" ? "high" : "medium");
          try {
            const response = await fetch(url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              thumbnailBuffer = Buffer.from(arrayBuffer);
              thumbnailUrl = url;
              break;
            }
          } catch {
            continue;
          }
        }
      }
    } else if (isDirectMediaUrl(videoUrl)) {
      // For direct URLs, try to download directly
      try {
        thumbnailBuffer = await downloadFile(videoUrl);
        thumbnailUrl = videoUrl;
      } catch {
        // Not accessible
      }
    } else {
      // For other platforms, try the URL directly as a last resort
      try {
        thumbnailBuffer = await downloadFile(videoUrl);
        thumbnailUrl = videoUrl;
      } catch {
        // Can't download
      }
    }
    
    // Process thumbnail if we have it
    if (thumbnailBuffer) {
      try {
        const metadata = await sharp(thumbnailBuffer).metadata();
        
        if (metadata.format && ["jpeg", "jpg", "png", "webp", "gif"].includes(metadata.format)) {
          // It's an image, use it as a frame
          const resized = await sharp(thumbnailBuffer)
            .resize(800, 600, { fit: "inside" })
            .jpeg({ quality: 80 })
            .toBuffer();
          
          const base64 = resized.toString("base64");
          const dataUrl = `data:image/jpeg;base64,${base64}`;
          
          return [
            {
              index: 0,
              imageUrl: dataUrl,
            },
          ];
        }
      } catch {
        // Not a valid image
      }
    }
    
    // If we can't extract frames, return empty array
    // The OCR step will handle this gracefully
    return [];
  } catch (error) {
    console.error("Frame extraction error:", error);
    return [];
  }
}

/**
 * Perform OCR on image
 * 
 * Priority:
 * 1. Google Cloud Vision API (if GOOGLE_CLOUD_API_KEY is set) - FAST, ~2-5 seconds
 * 2. Tesseract.js (fallback) - SLOW, ~30-300 seconds
 * 
 * For production, use Google Cloud Vision API for much faster processing.
 */
export async function performOCR(imageUrl: string): Promise<{
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }>;
}> {
  // Try Google Cloud Vision API first (much faster)
  if (process.env.GOOGLE_CLOUD_API_KEY) {
    try {
      const imageBuffer = await downloadFile(imageUrl);
      const base64Image = imageBuffer.toString("base64");

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [{ type: "TEXT_DETECTION" }], // maxResults not needed for TEXT_DETECTION
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Google Vision API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = `Google Vision API error: ${errorData.error.message}`;
          }
        } catch {
          // If we can't parse the error, use the text as-is
          if (errorText) {
            errorMessage = `Google Vision API error: ${errorText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check for API-level errors in the response
      if (data.responses?.[0]?.error) {
        throw new Error(`Google Vision API error: ${data.responses[0].error.message || "Unknown error"}`);
      }

      const textAnnotation = data.responses?.[0]?.fullTextAnnotation;

      if (textAnnotation?.text) {
        const text = textAnnotation.text || "";
        
        // Extract bounding boxes from the annotation structure
        const boundingBoxes: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          text: string;
        }> = [];

        // Parse bounding boxes from pages -> blocks -> paragraphs -> words
        if (textAnnotation.pages) {
          for (const page of textAnnotation.pages) {
            if (page.blocks) {
              for (const block of page.blocks) {
                if (block.paragraphs) {
                  for (const para of block.paragraphs) {
                    if (para.words) {
                      for (const word of para.words) {
                        if (word.boundingBox?.vertices && word.symbols) {
                          const vertices = word.boundingBox.vertices;
                          const wordText = word.symbols
                            .map((s: any) => s.text || "")
                            .join("");
                          
                          if (wordText && vertices.length >= 4) {
                            boundingBoxes.push({
                              x: vertices[0]?.x || 0,
                              y: vertices[0]?.y || 0,
                              width: Math.max(0, (vertices[2]?.x || 0) - (vertices[0]?.x || 0)),
                              height: Math.max(0, (vertices[2]?.y || 0) - (vertices[0]?.y || 0)),
                              text: wordText,
                            });
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }

        return {
          text: text.trim(),
          confidence: 0.95, // Google Vision is generally very accurate
          boundingBoxes,
        };
      }
      
      // If no fullTextAnnotation but there are textAnnotations, try to extract from those
      const textAnnotations = data.responses?.[0]?.textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        const texts = textAnnotations
          .map((ann: any) => ann.description || "")
          .filter(Boolean)
          .join(" ");
        
        if (texts) {
          return {
            text: texts.trim(),
            confidence: 0.90,
            boundingBoxes: [],
          };
        }
      }
    } catch (error: any) {
      console.warn("Google Cloud Vision OCR failed, falling back to Tesseract:", error.message);
      // Fall through to Tesseract.js
    }
  }

  // Fallback to Tesseract.js (slower but free, no API key needed)
  try {
    // Download image
    const imageBuffer = await downloadFile(imageUrl);
    
    // Perform OCR with timeout (5 minutes max)
    const ocrPromise = Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => {
        // Suppress verbose logging in production
        if (m.status === "recognizing text") {
          // Only log progress occasionally
        }
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tesseract OCR timeout after 5 minutes")), 300000)
    );

    const result = await Promise.race([ocrPromise, timeoutPromise]) as any;

    const text = result.data.text;
    const confidence = result.data.confidence || 0;

    // Extract bounding boxes from words if available
    const words = (result.data as any).words;
    const boundingBoxes = words?.map((word: any) => ({
      x: word.bbox.x0,
      y: word.bbox.y0,
      width: word.bbox.x1 - word.bbox.x0,
      height: word.bbox.y1 - word.bbox.y0,
      text: word.text,
    }));

    return {
      text: text.trim(),
      confidence: confidence || 0,
      boundingBoxes,
    };
  } catch (error: any) {
    console.error("OCR error:", error.message);
    // Don't return empty - throw so Inngest can retry
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Can handle both audio files and video files (extracts audio automatically)
 * 
 * For YouTube videos, first tries to fetch existing captions (faster and cheaper)
 * Falls back to Whisper API if captions aren't available
 */
export async function transcribeAudio(
  audioBufferOrUrl: Buffer | string,
  language?: string
): Promise<{
  text: string;
  language: string;
  confidence: number;
}> {
  try {
    // If it's a URL, check for platform-specific transcription options
    if (typeof audioBufferOrUrl === "string") {
      const platformInfo = detectPlatform(audioBufferOrUrl);
      
      // YouTube: Try multiple methods to get transcript
      if (platformInfo?.platform === "youtube") {
        const videoId = extractYouTubeVideoId(audioBufferOrUrl);
        if (videoId) {
          // Method 1: Try native YouTube captions API (fastest, free)
          const captions = await tryFetchYouTubeCaptions(videoId);
          if (captions) {
            console.log("[Transcribe YouTube] Using native YouTube captions");
            return {
              text: captions.text,
              language: captions.language,
              confidence: 0.9,
            };
          }
          
          // Method 2: Try Apify YouTube Transcript scraper (has its own caption extraction)
          if (isApifyConfigured()) {
            console.log("[Transcribe YouTube] Native captions not available, trying Apify transcript scraper...");
            try {
              const transcriptResult = await fetchYouTubeTranscript(audioBufferOrUrl);
              
              if (transcriptResult?.fullTranscriptText && transcriptResult.fullTranscriptText.trim().length > 0) {
                console.log("[Transcribe YouTube] Got transcript from Apify scraper:", 
                  transcriptResult.fullTranscriptText.slice(0, 200) + "...");
                return {
                  text: transcriptResult.fullTranscriptText,
                  language: transcriptResult.language || "en",
                  confidence: transcriptResult.isAutoGenerated ? 0.85 : 0.95,
                };
              } else {
                console.log("[Transcribe YouTube] Apify transcript scraper returned empty transcript");
              }
            } catch (apifyError: any) {
              console.error("[Transcribe YouTube] Apify transcript scraper failed:", apifyError.message);
            }
            
            // Method 3: Download video via Apify and use Whisper
            console.log("[Transcribe YouTube] Trying to download video for Whisper transcription...");
            try {
              const downloadResult = await fetchYouTubeDirectVideoUrl(audioBufferOrUrl);
              
              if (downloadResult?.directVideoUrl) {
                console.log("[Transcribe YouTube] Got direct video URL, downloading for Whisper...");
                const videoBuffer = await downloadVideoFile(downloadResult.directVideoUrl);
                console.log("[Transcribe YouTube] Downloaded video:", videoBuffer.length, "bytes, sending to Whisper...");
                
                // Transcribe with Whisper
                return transcribeAudio(videoBuffer, language);
              }
            } catch (downloadError: any) {
              console.error("[Transcribe YouTube] Video download failed:", downloadError.message);
            }
          }
          
          // No methods worked - throw helpful error
          throw new Error(
            "YouTube video transcription failed.\n\n" +
            "We tried:\n" +
            "1. Native YouTube captions - not available for this video\n" +
            (isApifyConfigured() 
              ? "2. Apify transcript scraper - failed or returned empty\n3. Apify video download + Whisper - failed\n\n"
              : "2. Apify scrapers - APIFY_API_TOKEN not configured\n\n") +
            "Solutions:\n" +
            "• Add APIFY_API_TOKEN to enable YouTube video download and transcription\n" +
            "• Try a different YouTube video that has captions enabled\n" +
            "• Download the video manually and upload to cloud storage"
          );
        }
      }
      
      // Platforms that require Apify for video download
      if (platformInfo && ["tiktok", "instagram", "facebook"].includes(platformInfo.platform)) {
        console.log(`[Transcribe] Detected ${platformInfo.platform} URL, checking Apify config...`);
        
        // Check if Apify is configured
        if (!isApifyConfigured()) {
          // Apify not configured - show helpful error
          throw new Error(
            `${platformInfo.platform.charAt(0).toUpperCase() + platformInfo.platform.slice(1)} videos require Apify for download.\n\n` +
            "To enable:\n" +
            "1. Sign up at apify.com\n" +
            "2. Get your API token from Settings → Integrations\n" +
            "3. Add APIFY_API_TOKEN to your environment variables\n\n" +
            "Alternative:\n" +
            "Download the video manually and upload to cloud storage (Cloudinary, S3), then provide the direct URL."
          );
        }
        
        console.log(`[Transcribe] Using Apify to download ${platformInfo.platform} video...`);
        
        try {
          const apifyResult = await downloadVideoWithApify(
            audioBufferOrUrl,
            platformInfo.platform as "tiktok" | "instagram" | "facebook"
          );
          
          if (!apifyResult?.videoUrl) {
            throw new Error(
              `Apify did not return a video URL. The video might be private, deleted, or not a video post.`
            );
          }
          
          console.log(`[Transcribe] Got video URL from Apify, downloading...`);
          
          // Download the actual video file
          const videoBuffer = await downloadVideoFile(apifyResult.videoUrl);
          
          console.log(`[Transcribe] Video downloaded (${videoBuffer.length} bytes), transcribing...`);
          
          // Now transcribe the downloaded video
          return transcribeAudio(videoBuffer, language);
        } catch (apifyError: any) {
          console.error("[Transcribe] Apify download failed:", apifyError.message);
          throw new Error(
            `Failed to download ${platformInfo.platform} video via Apify: ${apifyError.message}\n\n` +
            "The video might be private, deleted, or the URL format is not supported."
          );
        }
      }
    }

    let fileBuffer: Buffer;
    let filename: string;

    if (typeof audioBufferOrUrl === "string") {
      // If it's a URL, download it
      fileBuffer = await downloadFile(audioBufferOrUrl);
      // Determine file type from URL
      const extension = audioBufferOrUrl.split(".").pop()?.toLowerCase()?.split("?")[0] || "mp4";
      filename = `audio.${extension}`;
    } else {
      // If it's a buffer, detect format from magic bytes
      fileBuffer = audioBufferOrUrl;
      filename = detectFileTypeFromBuffer(fileBuffer);
    }

    // Determine MIME type from filename
    const mimeType = getMimeType(filename);
    console.log(`[Transcribe] Using filename: ${filename}, MIME type: ${mimeType}, buffer size: ${fileBuffer.length}`);

    // Convert Buffer to Blob for OpenAI File API
    // OpenAI expects a File or Blob, so we convert Buffer to Uint8Array first
    const uint8Array = new Uint8Array(fileBuffer);
    const blob = new Blob([uint8Array], { type: mimeType });
    
    // Create a File object from the Blob
    const fileForOpenAI = new File([blob], filename, { type: mimeType });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fileForOpenAI,
      model: "whisper-1",
      language: language || undefined,
      response_format: "verbose_json",
    });

    return {
      text: transcription.text,
      language: transcription.language || "en",
      confidence: 1.0, // Whisper doesn't provide confidence scores
    };
  } catch (error: any) {
    console.error("Transcription error:", error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Try to fetch YouTube captions (auto-generated or manual)
 * Returns null if captions aren't available
 */
async function tryFetchYouTubeCaptions(
  videoId: string
): Promise<{ text: string; language: string } | null> {
  try {
    // Try manual captions first (usually more accurate)
    const manualUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
    
    let response = await fetch(manualUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      // Try auto-generated captions
      const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=json3`;
      response = await fetch(autoUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return null;
      }
    }

    const data = await response.json();
    
    // Extract text from caption data
    if (data.events) {
      const segments = data.events
        .filter((e: any) => e.segs)
        .flatMap((e: any) => e.segs)
        .map((s: any) => s.utf8)
        .filter(Boolean);

      const text = segments.join(" ").replace(/\s+/g, " ").trim();
      
      if (text.length > 0) {
        return { text, language: "en" };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate visual embeddings for similarity search using OpenAI
 * Uses OpenAI's vision model to generate embeddings
 */
export async function generateVisualEmbedding(
  imageUrl: string
): Promise<number[]> {
  try {
    // Download image
    const imageBuffer = await downloadFile(imageUrl);
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    // Use OpenAI's embedding model (text-embedding-3-small or similar)
    // For images, we'll use the vision API to get a description, then embed that
    // Or use a vision embedding model if available
    
    // For now, we'll use OpenAI's vision API to get a description
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4-vision-preview
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl, // OpenAI can handle URLs directly
              },
            },
            {
              type: "text",
              text: "Describe this image in detail for embedding purposes.",
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const description = visionResponse.choices[0]?.message?.content || "";

    // Now embed the description
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description,
    });

    return embeddingResponse.data[0].embedding;
  } catch (error: any) {
    console.error("Visual embedding error:", error);
    // Return zero vector as fallback
    return new Array(1536).fill(0);
  }
}

/**
 * Calculate perceptual hash for duplicate detection
 * Uses a simple hash based on image features
 */
export async function calculatePerceptualHash(
  imageUrl: string
): Promise<string> {
  try {
    // Download image
    const imageBuffer = await downloadFile(imageUrl);
    
    // Resize to 8x8 for hash calculation
    const resized = await sharp(imageBuffer)
      .resize(8, 8, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer();

    // Calculate average
    const pixels = Array.from(resized);
    const average = pixels.reduce((a, b) => a + b, 0) / pixels.length;

    // Generate hash: 1 if pixel > average, 0 otherwise
    const hash = pixels.map((pixel) => (pixel > average ? "1" : "0")).join("");

    return hash;
  } catch (error) {
    console.error("Perceptual hash error:", error);
    return "";
  }
}

/**
 * Extract dominant colors from image
 */
export async function extractDominantColors(
  imageUrl: string,
  count: number = 5
): Promise<Array<{ r: number; g: number; b: number; hex: string }>> {
  try {
    // Download image
    const imageBuffer = await downloadFile(imageUrl);
    
    // Resize for faster processing and get raw pixel data
    const resized = await sharp(imageBuffer)
      .resize(200, 200, { fit: "inside" })
      .raw()
      .toBuffer();

    // Get image metadata
    const metadata = await sharp(imageBuffer)
      .resize(200, 200, { fit: "inside" })
      .metadata();

    // Simple approach: sample colors from the image
    const colors: Array<{ r: number; g: number; b: number; count: number }> = [];
    const step = Math.floor(resized.length / (count * 3));
    
    for (let i = 0; i < resized.length; i += step * 3) {
      if (i + 2 < resized.length) {
        const r = resized[i];
        const g = resized[i + 1];
        const b = resized[i + 2];
        colors.push({ r, g, b, count: 1 });
      }
    }

    // Group similar colors and return top N
    const grouped = colors.slice(0, count).map((color) => ({
      r: color.r,
      g: color.g,
      b: color.b,
      hex: `#${[color.r, color.g, color.b]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")}`,
    }));

    return grouped;
  } catch (error) {
    console.error("Color extraction error:", error);
    return [];
  }
}
