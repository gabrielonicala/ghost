/**
 * Google Cloud Video Intelligence API integration
 * 
 * Extracts text from videos using Google's ML-powered video analysis.
 * This handles frame extraction automatically and can detect text overlays.
 */

const VIDEO_INTELLIGENCE_API = "https://videointelligence.googleapis.com/v1/videos:annotate";

interface TextAnnotation {
  text: string;
  segments: Array<{
    segment: {
      startTimeOffset: string;
      endTimeOffset: string;
    };
    confidence: number;
  }>;
}

interface VideoAnnotationResponse {
  name: string; // Operation name for polling
}

interface OperationResult {
  done: boolean;
  response?: {
    annotationResults: Array<{
      textAnnotations?: TextAnnotation[];
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Extract text from video using Google Cloud Video Intelligence API
 * 
 * @param videoUrl - URL to the video file (must be accessible)
 * @param videoBuffer - Optional: video content as Buffer (for uploaded videos)
 * @returns Extracted text with timestamps
 */
export async function extractTextFromVideo(
  videoUrl?: string,
  videoBuffer?: Buffer
): Promise<{
  texts: Array<{
    text: string;
    confidence: number;
    startTime?: number;
    endTime?: number;
  }>;
  fullText: string;
}> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY is required for Video Intelligence API");
  }

  console.log("[VideoIntelligence] Starting text extraction...");

  // Build the request
  const requestBody: any = {
    features: ["TEXT_DETECTION"],
    videoContext: {
      textDetectionConfig: {
        languageHints: ["en"], // Primary language
      },
    },
  };

  // Use either URL or base64 content
  if (videoBuffer) {
    requestBody.inputContent = videoBuffer.toString("base64");
    console.log("[VideoIntelligence] Using base64 content, size:", videoBuffer.length);
  } else if (videoUrl) {
    requestBody.inputUri = videoUrl;
    console.log("[VideoIntelligence] Using URL:", videoUrl);
  } else {
    throw new Error("Either videoUrl or videoBuffer must be provided");
  }

  // Start the annotation job
  const startResponse = await fetch(`${VIDEO_INTELLIGENCE_API}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!startResponse.ok) {
    const error = await startResponse.text();
    console.error("[VideoIntelligence] Start error:", error);
    throw new Error(`Video Intelligence API error: ${error}`);
  }

  const startData: VideoAnnotationResponse = await startResponse.json();
  const operationName = startData.name;
  console.log("[VideoIntelligence] Operation started:", operationName);

  // Poll for completion (Video Intelligence is async)
  const result = await pollOperation(operationName, apiKey);

  // Extract text from results
  const texts: Array<{
    text: string;
    confidence: number;
    startTime?: number;
    endTime?: number;
  }> = [];

  const textAnnotations = result.response?.annotationResults?.[0]?.textAnnotations || [];

  for (const annotation of textAnnotations) {
    const segment = annotation.segments?.[0];
    texts.push({
      text: annotation.text,
      confidence: segment?.confidence || 0.9,
      startTime: segment?.segment?.startTimeOffset 
        ? parseTimeOffset(segment.segment.startTimeOffset) 
        : undefined,
      endTime: segment?.segment?.endTimeOffset
        ? parseTimeOffset(segment.segment.endTimeOffset)
        : undefined,
    });
  }

  // Build full text (unique texts, sorted by time if available)
  const uniqueTexts = [...new Set(texts.map(t => t.text))];
  const fullText = uniqueTexts.join("\n");

  console.log("[VideoIntelligence] Extracted", texts.length, "text segments");
  console.log("[VideoIntelligence] Full text:", fullText.slice(0, 200));

  return { texts, fullText };
}

/**
 * Poll for operation completion
 */
async function pollOperation(
  operationName: string,
  apiKey: string,
  timeoutMs: number = 180000 // 3 minutes
): Promise<OperationResult> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(
      `https://videointelligence.googleapis.com/v1/${operationName}?key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to poll operation: ${error}`);
    }

    const result: OperationResult = await response.json();

    if (result.done) {
      if (result.error) {
        throw new Error(`Video Intelligence error: ${result.error.message}`);
      }
      return result;
    }

    console.log("[VideoIntelligence] Still processing, waiting...");
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error("Video Intelligence operation timed out");
}

/**
 * Parse time offset string (e.g., "1.5s" or "90s") to seconds
 */
function parseTimeOffset(offset: string): number {
  const match = offset.match(/^(\d+\.?\d*)s$/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Check if Video Intelligence API is available
 */
export function isVideoIntelligenceAvailable(): boolean {
  return !!process.env.GOOGLE_CLOUD_API_KEY;
}

