/**
 * Google Cloud Video Intelligence API integration
 * 
 * Extracts text from videos using Google's ML-powered video analysis.
 * This handles frame extraction automatically and can detect text overlays.
 * 
 * Requires service account authentication (not API keys).
 */

import { VideoIntelligenceServiceClient } from "@google-cloud/video-intelligence";

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

/**
 * Get Google Cloud credentials from environment variables
 * Supports both:
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to JSON key file (local dev)
 * - GOOGLE_SERVICE_ACCOUNT_KEY: Base64-encoded JSON key (Vercel/production)
 */
function getCredentials(): any {
  // Option 1: Base64 encoded JSON key (for Vercel)
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (base64Key) {
    try {
      const keyJson = Buffer.from(base64Key, "base64").toString("utf-8");
      return JSON.parse(keyJson);
    } catch (error) {
      throw new Error(
        "Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY. Ensure it's base64-encoded JSON."
      );
    }
  }

  // Option 2: Path to JSON key file (for local dev)
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    // The client library will automatically use this path
    return undefined; // Let the library handle it
  }

  throw new Error(
    "Google Cloud credentials not found. Set either GOOGLE_APPLICATION_CREDENTIALS (file path) or GOOGLE_SERVICE_ACCOUNT_KEY (base64 JSON)."
  );
}

/**
 * Create Video Intelligence client with proper authentication
 */
function createClient(): VideoIntelligenceServiceClient {
  const credentials = getCredentials();
  
  if (credentials) {
    // Use explicit credentials (base64 JSON)
    return new VideoIntelligenceServiceClient({
      credentials,
    });
  } else {
    // Use GOOGLE_APPLICATION_CREDENTIALS path or default credentials
    return new VideoIntelligenceServiceClient();
  }
}

/**
 * Extract text from video using Google Cloud Video Intelligence API
 * 
 * @param videoUrl - URL to the video file (must be accessible via Google Cloud Storage or public URL)
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
  console.log("[VideoIntelligence] Starting text extraction...");

  const client = createClient();

  // Build the request
  const request: any = {
    features: ["TEXT_DETECTION"],
    videoContext: {
      textDetectionConfig: {
        languageHints: ["en"], // Primary language
      },
    },
  };

  // Use either URL or base64 content
  if (videoBuffer) {
    // For buffer content, we need to use inputContent
    request.inputContent = videoBuffer.toString("base64");
    console.log("[VideoIntelligence] Using base64 content, size:", videoBuffer.length);
  } else if (videoUrl) {
    // For URLs, must be a Google Cloud Storage URI (gs://) or publicly accessible
    // If it's not a GCS URI, we might need to upload it first or use inputContent
    if (videoUrl.startsWith("gs://")) {
      request.inputUri = videoUrl;
      console.log("[VideoIntelligence] Using GCS URI:", videoUrl);
    } else {
      // For public URLs, we need to download and use inputContent
      // Or upload to GCS first (better for large files)
      console.log("[VideoIntelligence] Public URL detected, downloading...");
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video from URL: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      request.inputContent = buffer.toString("base64");
      console.log("[VideoIntelligence] Downloaded and using base64 content");
    }
  } else {
    throw new Error("Either videoUrl or videoBuffer must be provided");
  }

  // Start the annotation job (this is async)
  console.log("[VideoIntelligence] Starting annotation operation...");
  const [operation] = await client.annotateVideo(request);

  if (!operation.name) {
    throw new Error("Failed to start Video Intelligence operation");
  }

  console.log("[VideoIntelligence] Operation started:", operation.name);

  // Wait for operation to complete
  // The operation object has a promise() method that resolves when done
  let result: any;
  try {
    // Try using the promise method if available
    if (typeof (operation as any).promise === "function") {
      result = await (operation as any).promise();
    } else {
      // Fallback to polling
      result = await pollOperation(operation.name, client);
    }
  } catch (error: any) {
    // If promise fails, try polling
    result = await pollOperation(operation.name, client);
  }

  // Extract text from results
  const texts: Array<{
    text: string;
    confidence: number;
    startTime?: number;
    endTime?: number;
  }> = [];

  const annotationResults = result.annotationResults || [];
  for (const annotationResult of annotationResults) {
    const textAnnotations = annotationResult.textAnnotations || [];
    for (const annotation of textAnnotations) {
      const segment = annotation.segments?.[0];
      if (annotation.text) {
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
    }
  }

  // Build full text (unique texts, sorted by time if available)
  const uniqueTexts = [...new Set(texts.map((t) => t.text))];
  const fullText = uniqueTexts.join("\n");

  console.log("[VideoIntelligence] Extracted", texts.length, "text segments");
  console.log("[VideoIntelligence] Full text:", fullText.slice(0, 200));

  return { texts, fullText };
}

/**
 * Poll for operation completion
 * Uses REST API directly since the client library doesn't expose operations client
 */
async function pollOperation(
  operationName: string,
  client: VideoIntelligenceServiceClient,
  timeoutMs: number = 180000 // 3 minutes
): Promise<any> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  // Get credentials for REST API calls
  const credentials = getCredentials();
  let accessToken: string | null = null;

  // If using service account, we need to get an access token
  // For now, we'll use the operation's promise if available, or poll via REST
  // The operation object might have a promise() method
  const operation = await getOperationStatus(operationName, credentials);
  
  if (operation?.done) {
    if (operation.error) {
      throw new Error(
        `Video Intelligence error: ${operation.error.message || "Unknown error"}`
      );
    }
    if (operation.response) {
      return operation.response as any;
    }
  }

  // Poll until done
  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    
    const operation = await getOperationStatus(operationName, credentials);
    
    if (operation?.done) {
      if (operation.error) {
        throw new Error(
          `Video Intelligence error: ${operation.error.message || "Unknown error"}`
        );
      }
      if (operation.response) {
        return operation.response as any;
      }
    }

    console.log("[VideoIntelligence] Still processing, waiting...");
  }

  throw new Error("Video Intelligence operation timed out");
}

/**
 * Get operation status via REST API
 */
async function getOperationStatus(
  operationName: string,
  credentials: any
): Promise<any> {
  // Use the REST API endpoint directly
  // The operation name format is: projects/{project}/locations/{location}/operations/{operation}
  const apiUrl = `https://videointelligence.googleapis.com/v1/${operationName}`;
  
  // Get access token from credentials
  const { GoogleAuth } = await import("google-auth-library");
  const auth = credentials 
    ? new GoogleAuth({ credentials })
    : new GoogleAuth();
  
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  if (!token) {
    throw new Error("Failed to get access token for Video Intelligence API");
  }

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get operation status: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Parse time offset string (e.g., "1.5s" or "90s") to seconds
 */
function parseTimeOffset(offset: string): number {
  // Handle both "1.5s" format and protobuf duration format
  if (offset.endsWith("s")) {
    const match = offset.match(/^(\d+\.?\d*)s$/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  // Handle protobuf duration (e.g., "1.5s" or just seconds as number)
  const seconds = parseFloat(offset);
  return isNaN(seconds) ? 0 : seconds;
}

/**
 * Check if Video Intelligence API is available
 */
export function isVideoIntelligenceAvailable(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  );
}
