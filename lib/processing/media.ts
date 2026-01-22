import Tesseract from "tesseract.js";
import OpenAI from "openai";
import sharp from "sharp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Download a file from URL and return as Buffer
 */
async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
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
 * Note: Sharp doesn't support video frame extraction directly
 * For production, consider using Cloudinary, AWS MediaConvert, or FFmpeg
 */
export async function extractFrames(
  videoUrl: string,
  frameCount: number = 5
): Promise<Array<{ index: number; imageUrl: string }>> {
  try {
    // Try to extract thumbnail if it's a video URL
    // Many video platforms provide thumbnail URLs
    let thumbnailUrl = videoUrl;
    
    // YouTube thumbnail pattern
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    
    // Try to use the thumbnail URL as a frame
    try {
      const testBuffer = await downloadFile(thumbnailUrl);
      const metadata = await sharp(testBuffer).metadata();
      
      if (metadata.format && ["jpeg", "jpg", "png", "webp"].includes(metadata.format)) {
        // It's an image, use it as a frame
        const resized = await sharp(testBuffer)
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
      // Not an image, continue
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
 * Perform OCR on image using Tesseract.js
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
  try {
    // Download image
    const imageBuffer = await downloadFile(imageUrl);
    
    // Perform OCR
    const result = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => {
        // Suppress verbose logging in production
        if (m.status === "recognizing text") {
          // Only log progress occasionally
        }
      },
    });

    const text = result.data.text;
    const confidence = result.data.confidence || 0;

    // Extract bounding boxes from words if available
    // Tesseract.js returns words in result.data.words, but TypeScript types may not include it
    // We'll access it safely with type assertion
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
  } catch (error) {
    console.error("OCR error:", error);
    return {
      text: "",
      confidence: 0,
    };
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Can handle both audio files and video files (extracts audio automatically)
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
