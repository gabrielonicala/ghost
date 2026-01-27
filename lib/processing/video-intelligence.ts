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
 * Based on official documentation: https://docs.cloud.google.com/video-intelligence/docs/text-detection
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

  // Build the request according to official docs
  const request: any = {
    features: ["TEXT_DETECTION"],
    videoContext: {
      textDetectionConfig: {
        languageHints: ["en"],
      },
    },
  };

  // Use either URL or base64 content (per official docs)
  if (videoBuffer) {
    // For local files, base64 encode the content
    request.inputContent = videoBuffer.toString("base64");
    console.log("[VideoIntelligence] Using base64 content, size:", videoBuffer.length);
  } else if (videoUrl) {
    if (videoUrl.startsWith("gs://")) {
      // Cloud Storage URI
      request.inputUri = videoUrl;
      console.log("[VideoIntelligence] Using GCS URI:", videoUrl);
    } else {
      // Public URL - download and use inputContent (per docs)
      console.log("[VideoIntelligence] Public URL detected, downloading...");
      const response = await fetch(videoUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to download video from URL: ${response.status} ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      request.inputContent = buffer.toString("base64");
      console.log("[VideoIntelligence] Downloaded and using base64 content");
    }
  } else {
    throw new Error("Either videoUrl or videoBuffer must be provided");
  }

  // Start the annotation job (per official Node.js example)
  console.log("[VideoIntelligence] Starting annotation operation...");
  const [operation] = await client.annotateVideo(request);

  if (!operation.name) {
    throw new Error("Failed to start Video Intelligence operation");
  }

  console.log("[VideoIntelligence] Operation started:", operation.name);
  console.log("[VideoIntelligence] Waiting for operation to complete...");

  // Wait for operation to complete using promise() method (per official docs)
  let results: any;
  try {
    // According to official docs, operation.promise() returns the results
    console.log("[VideoIntelligence] Calling operation.promise()...");
    results = await operation.promise();
    console.log("[VideoIntelligence] Operation completed");
    console.log("[VideoIntelligence] Results type:", typeof results);
    console.log("[VideoIntelligence] Results is array:", Array.isArray(results));
    if (results) {
      console.log("[VideoIntelligence] Results keys:", Object.keys(results));
      if (Array.isArray(results)) {
        console.log("[VideoIntelligence] Results array length:", results.length);
        if (results.length > 0) {
          console.log("[VideoIntelligence] Results[0] keys:", Object.keys(results[0] || {}));
        }
      }
    }
  } catch (error: any) {
    console.error("[VideoIntelligence] Operation promise failed:", error.message);
    console.error("[VideoIntelligence] Error stack:", error.stack);
    // Fallback to polling if promise() doesn't work
    console.log("[VideoIntelligence] Falling back to polling...");
    results = await pollOperation(operation.name, client);
    console.log("[VideoIntelligence] Polling completed, results type:", typeof results);
  }

  // Extract text annotations (per official Node.js example structure)
  // results[0].annotationResults[0].textAnnotations
  let textAnnotations: any[] = [];
  
  console.log("[VideoIntelligence] Parsing results...");
  console.log("[VideoIntelligence] Full results structure (first 5000 chars):", JSON.stringify(results, null, 2).slice(0, 5000));
  
  if (results && Array.isArray(results) && results.length > 0) {
    console.log("[VideoIntelligence] Path 1: results is array with length", results.length);
    const annotationResults = results[0]?.annotationResults;
    console.log("[VideoIntelligence] annotationResults:", annotationResults ? "exists" : "missing");
    if (annotationResults && Array.isArray(annotationResults) && annotationResults.length > 0) {
      console.log("[VideoIntelligence] annotationResults[0] keys:", Object.keys(annotationResults[0] || {}));
      textAnnotations = annotationResults[0]?.textAnnotations || [];
      console.log("[VideoIntelligence] Found", textAnnotations.length, "textAnnotations in path 1");
    }
  } else if (results?.annotationResults) {
    console.log("[VideoIntelligence] Path 2: results.annotationResults exists");
    const annotationResults = Array.isArray(results.annotationResults) 
      ? results.annotationResults 
      : [results.annotationResults];
    if (annotationResults.length > 0) {
      textAnnotations = annotationResults[0]?.textAnnotations || [];
      console.log("[VideoIntelligence] Found", textAnnotations.length, "textAnnotations in path 2");
    }
  } else if (results?.response?.annotationResults) {
    console.log("[VideoIntelligence] Path 3: results.response.annotationResults exists");
    const annotationResults = Array.isArray(results.response.annotationResults)
      ? results.response.annotationResults
      : [results.response.annotationResults];
    if (annotationResults.length > 0) {
      textAnnotations = annotationResults[0]?.textAnnotations || [];
      console.log("[VideoIntelligence] Found", textAnnotations.length, "textAnnotations in path 3");
    }
  } else {
    console.warn("[VideoIntelligence] Could not find textAnnotations in any expected path");
    console.warn("[VideoIntelligence] Results structure:", JSON.stringify(results, null, 2).slice(0, 2000));
  }

  console.log("[VideoIntelligence] Final textAnnotations count:", textAnnotations.length);

  // Extract text from annotations (per official docs structure)
  // Each textAnnotation represents a unique piece of text that appears in the video
  // We need to group text that appears at the same time together
  const texts: Array<{
    text: string;
    confidence: number;
    startTime?: number;
    endTime?: number;
  }> = [];

  // Track seen texts to avoid exact duplicates (case-insensitive)
  const seenTexts = new Set<string>();

  for (const textAnnotation of textAnnotations) {
    let text = textAnnotation.text;
    if (!text) continue;

    // Clean up the text - remove extra whitespace
    text = text.trim().replace(/\s+/g, " ");
    if (text.length === 0) continue;

    // Create a normalized key for deduplication (lowercase, no extra spaces)
    const normalizedKey = text.toLowerCase().trim();
    
    // Skip if we've already seen this exact text
    // (same text might appear multiple times in video at different times)
    if (seenTexts.has(normalizedKey)) {
      continue;
    }
    seenTexts.add(normalizedKey);

    // Get segments to find timing information
    const segments = textAnnotation.segments || [];
    let startTime: number | undefined;
    let endTime: number | undefined;
    let confidence = 0.9;

    // Use the first (earliest) segment's timing
    if (segments.length > 0) {
      // Find the earliest segment
      let earliestSegment = segments[0];
      let earliestTime = parseTimeOffsetFromProtobuf(segments[0]?.segment?.startTimeOffset || {});
      
      for (const segment of segments) {
        const segTime = parseTimeOffsetFromProtobuf(segment?.segment?.startTimeOffset || {});
        if (segTime < earliestTime) {
          earliestTime = segTime;
          earliestSegment = segment;
        }
      }

      const time = earliestSegment.segment;
      startTime = time?.startTimeOffset 
        ? parseTimeOffsetFromProtobuf(time.startTimeOffset)
        : undefined;
      endTime = time?.endTimeOffset
        ? parseTimeOffsetFromProtobuf(time.endTimeOffset)
        : undefined;
      confidence = earliestSegment.confidence || 0.9;
    }

    texts.push({
      text: text,
      confidence: confidence,
      startTime: startTime,
      endTime: endTime,
    });
  }

  // Sort by start time (chronological order) if available
  texts.sort((a, b) => {
    if (a.startTime !== undefined && b.startTime !== undefined) {
      return a.startTime - b.startTime;
    }
    if (a.startTime !== undefined) return -1;
    if (b.startTime !== undefined) return 1;
    return 0;
  });

  // Group text that appears at roughly the same time (within 0.5 seconds)
  // This prevents mixing text that appears simultaneously on screen
  const timeGroups: Array<{ time: number; texts: string[] }> = [];
  const TIME_WINDOW = 0.5; // 500ms window for grouping simultaneous text

  for (const textItem of texts) {
    if (textItem.startTime === undefined) {
      // Text without timing - add to last group or create new one
      if (timeGroups.length > 0) {
        timeGroups[timeGroups.length - 1].texts.push(textItem.text);
      } else {
        timeGroups.push({ time: 0, texts: [textItem.text] });
      }
      continue;
    }

    // Find a group within the time window, or create a new one
    let foundGroup = false;
    for (const group of timeGroups) {
      if (Math.abs(group.time - textItem.startTime) <= TIME_WINDOW) {
        group.texts.push(textItem.text);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      timeGroups.push({
        time: textItem.startTime,
        texts: [textItem.text],
      });
    }
  }

  // Join text within each time group (text that appears together)
  // Then join groups in chronological order
  const groupedTexts = timeGroups.map(group => group.texts.join(" "));
  const fullText = groupedTexts.join(" ").trim();

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
 * Parse protobuf duration to seconds
 * Per official docs, timeOffset has seconds and nanos properties
 */
function parseTimeOffsetFromProtobuf(timeOffset: any): number {
  if (!timeOffset) return 0;
  
  // Handle protobuf Duration format: { seconds: number, nanos: number }
  const seconds = timeOffset.seconds || 0;
  const nanos = timeOffset.nanos || 0;
  
  return seconds + nanos / 1e9;
}

/**
 * Detect logos in video using Google Cloud Video Intelligence API
 * Based on official documentation
 */
export async function detectLogosInVideo(
  videoUrl?: string,
  videoBuffer?: Buffer
): Promise<Array<{
  entityId: string;
  description: string;
  segments: Array<{
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}>> {
  console.log("[VideoIntelligence] Starting logo detection...");

  const client = createClient();

  const request: any = {
    features: ["LOGO_RECOGNITION"],
  };

  if (videoBuffer) {
    request.inputContent = videoBuffer.toString("base64");
    console.log("[VideoIntelligence] Using base64 content for logo detection");
  } else if (videoUrl) {
    if (videoUrl.startsWith("gs://")) {
      request.inputUri = videoUrl;
    } else {
      const response = await fetch(videoUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      request.inputContent = buffer.toString("base64");
    }
  } else {
    throw new Error("Either videoUrl or videoBuffer must be provided");
  }

  const [operation] = await client.annotateVideo(request);

  if (!operation.name) {
    throw new Error("Failed to start logo detection operation");
  }

  console.log("[VideoIntelligence] Logo detection operation started:", operation.name);

  let results: any;
  try {
    results = await operation.promise();
  } catch (error: any) {
    console.error("[VideoIntelligence] Logo detection operation failed:", error.message);
    results = await pollOperation(operation.name, client);
  }

  const logos: Array<{
    entityId: string;
    description: string;
    segments: Array<{
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
  }> = [];

  let logoAnnotations: any[] = [];
  
  if (results && Array.isArray(results) && results.length > 0) {
    const annotationResults = results[0]?.annotationResults;
    if (annotationResults && Array.isArray(annotationResults) && annotationResults.length > 0) {
      logoAnnotations = annotationResults[0]?.logoRecognitionAnnotations || [];
    }
  } else if (results?.annotationResults) {
    const annotationResults = Array.isArray(results.annotationResults) 
      ? results.annotationResults 
      : [results.annotationResults];
    if (annotationResults.length > 0) {
      logoAnnotations = annotationResults[0]?.logoRecognitionAnnotations || [];
    }
  }

  for (const logoAnnotation of logoAnnotations) {
    const entity = logoAnnotation.entity;
    if (!entity) continue;

    const segments = logoAnnotation.tracks || [];
    const logoSegments = segments.map((track: any) => {
      const segment = track.segment;
      return {
        startTime: segment?.startTimeOffset 
          ? parseTimeOffsetFromProtobuf(segment.startTimeOffset)
          : 0,
        endTime: segment?.endTimeOffset
          ? parseTimeOffsetFromProtobuf(segment.endTimeOffset)
          : 0,
        confidence: track.confidence || 0.9,
      };
    });

    logos.push({
      entityId: entity.entityId || "",
      description: entity.description || "",
      segments: logoSegments,
    });
  }

  console.log("[VideoIntelligence] Detected", logos.length, "logos");
  return logos;
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
