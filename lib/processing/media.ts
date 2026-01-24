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
} from "@/lib/platforms";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * Extract frames from video for OCR
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
                features: [{ type: "TEXT_DETECTION", maxResults: 10 }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const textAnnotation = data.responses?.[0]?.fullTextAnnotation;

      if (textAnnotation) {
        const text = textAnnotation.text || "";
        const boundingBoxes = textAnnotation.pages?.[0]?.blocks
          ?.flatMap((block: any) =>
            block.paragraphs?.flatMap((para: any) =>
              para.words?.map((word: any) => {
                const vertices = word.boundingBox.vertices;
                return {
                  x: vertices[0]?.x || 0,
                  y: vertices[0]?.y || 0,
                  width: (vertices[2]?.x || 0) - (vertices[0]?.x || 0),
                  height: (vertices[2]?.y || 0) - (vertices[0]?.y || 0),
                  text: word.symbols?.map((s: any) => s.text).join("") || "",
                };
              })
            )
          )
          .filter(Boolean) || [];

        return {
          text: text.trim(),
          confidence: 0.95, // Google Vision is generally very accurate
          boundingBoxes,
        };
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
      
      // YouTube: Try to get captions (YouTube URLs are web pages, not video files)
      if (platformInfo?.platform === "youtube") {
        const videoId = extractYouTubeVideoId(audioBufferOrUrl);
        if (videoId) {
          const captions = await tryFetchYouTubeCaptions(videoId);
          if (captions) {
            console.log("Using YouTube captions instead of Whisper API");
            return {
              text: captions.text,
              language: captions.language,
              confidence: 0.9, // YouTube auto-captions are generally accurate
            };
          }
          
          // No captions available - YouTube URLs can't be downloaded directly
          throw new Error(
            "YouTube video has no captions available.\n\n" +
            "YouTube URLs are web pages, not direct video files. Without captions, " +
            "we cannot transcribe the video directly.\n\n" +
            "Solutions:\n" +
            "1. Try a different YouTube video that has captions enabled\n" +
            "2. Download the video using a tool like yt-dlp, upload to cloud storage (Cloudinary, S3), " +
            "and provide the direct video file URL\n" +
            "3. Enable captions on the YouTube video if you own it"
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
      const extension = audioBufferOrUrl.split(".").pop()?.toLowerCase() || "mp4";
      filename = `audio.${extension}`;
    } else {
      // If it's a buffer, use it directly
      fileBuffer = audioBufferOrUrl;
      filename = "audio.mp3";
    }

    // Convert Buffer to Blob for OpenAI File API
    // OpenAI expects a File or Blob, so we convert Buffer to Uint8Array first
    const uint8Array = new Uint8Array(fileBuffer);
    const blob = new Blob([uint8Array], {
      type: filename.endsWith(".mp4") || filename.endsWith(".mov")
        ? "video/mp4"
        : "audio/mpeg",
    });
    
    // Create a File object from the Blob
    const fileForOpenAI = new File([blob], filename, {
      type: filename.endsWith(".mp4") || filename.endsWith(".mov")
        ? "video/mp4"
        : "audio/mpeg",
    });

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
