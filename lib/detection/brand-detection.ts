import { prisma } from "@/lib/prisma";

interface DetectionResult {
  detected: boolean;
  confidence: number;
  method: string;
  matchedText?: string;
  matchedKeywords: string[];
}

/**
 * Detects brand mentions in content using multiple methods
 */
export async function detectBrandContent(
  contentItemId: string,
  organizationId: string,
  textSources: {
    caption?: string;
    transcript?: string;
    ocrText?: string[];
  }
): Promise<DetectionResult[]> {
  // Get brand dictionaries for this organization
  if (!prisma) {
    // Prisma not available (e.g., on Vercel) - skip brand detection for now
    // TODO: Implement using Supabase client
    console.warn("Prisma not available, skipping brand detection");
    return [];
  }
  
  const brandDictionaries = await prisma.brandDictionary.findMany({
    where: { organizationId },
  });

  if (brandDictionaries.length === 0) {
    return [];
  }

  const results: DetectionResult[] = [];

  // Combine all text sources
  const allText = [
    textSources.caption || "",
    textSources.transcript || "",
    ...(textSources.ocrText || []),
  ]
    .filter((t) => t.length > 0)
    .join(" ")
    .toLowerCase();

  for (const dictionary of brandDictionaries) {
    // Method 1: Keyword matching in caption/transcript
    const captionMatch = detectKeywords(
      textSources.caption || "",
      dictionary.keywords,
      dictionary.productNames
    );
    if (captionMatch.detected) {
      results.push({
        ...captionMatch,
        method: "caption",
      });
      await saveDetection(contentItemId, dictionary.id, "caption", captionMatch);
    }

    // Method 2: Keyword matching in transcript
    if (textSources.transcript) {
      const transcriptMatch = detectKeywords(
        textSources.transcript,
        dictionary.keywords,
        dictionary.productNames
      );
      if (transcriptMatch.detected) {
        results.push({
          ...transcriptMatch,
          method: "transcript",
        });
        await saveDetection(
          contentItemId,
          dictionary.id,
          "transcript",
          transcriptMatch
        );
      }
    }

    // Method 3: OCR text matching
    if (textSources.ocrText && textSources.ocrText.length > 0) {
      for (const ocrText of textSources.ocrText) {
        const ocrMatch = detectKeywords(
          ocrText,
          dictionary.keywords,
          dictionary.productNames
        );
        if (ocrMatch.detected) {
          results.push({
            ...ocrMatch,
            method: "ocr",
          });
          await saveDetection(
            contentItemId,
            dictionary.id,
            "ocr",
            ocrMatch
          );
          break; // Only save once per dictionary
        }
      }
    }
  }

  return results;
}

/**
 * Detects keywords in text
 */
function detectKeywords(
  text: string,
  keywords: string[],
  productNames: string[]
): Omit<DetectionResult, "method"> {
  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  let maxConfidence = 0;
  let matchedText: string | undefined;

  // Check keywords
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerText.includes(lowerKeyword)) {
      matchedKeywords.push(keyword);
      // Calculate confidence based on context
      const index = lowerText.indexOf(lowerKeyword);
      const context = lowerText.substring(
        Math.max(0, index - 20),
        Math.min(text.length, index + keyword.length + 20)
      );
      matchedText = context;
      maxConfidence = Math.max(maxConfidence, 0.8);
    }
  }

  // Check product names (higher confidence)
  for (const productName of productNames) {
    const lowerProduct = productName.toLowerCase();
    if (lowerText.includes(lowerProduct)) {
      matchedKeywords.push(productName);
      const index = lowerText.indexOf(lowerProduct);
      const context = lowerText.substring(
        Math.max(0, index - 20),
        Math.min(text.length, index + productName.length + 20)
      );
      matchedText = context;
      maxConfidence = Math.max(maxConfidence, 0.95);
    }
  }

  return {
    detected: matchedKeywords.length > 0,
    confidence: maxConfidence,
    matchedText,
    matchedKeywords,
  };
}

/**
 * Saves detection to database
 */
async function saveDetection(
  contentItemId: string,
  brandDictionaryId: string,
  method: string,
  result: Omit<DetectionResult, "method">
): Promise<void> {
  if (!prisma) {
    // Prisma not available - skip saving (already checked in detectBrandContent)
    return;
  }
  
  await prisma.brandDetection.create({
    data: {
      contentItemId,
      brandDictionaryId,
      detectionMethod: method,
      confidence: result.confidence,
      matchedText: result.matchedText,
      matchedKeywords: result.matchedKeywords,
    },
  });
}

/**
 * Visual similarity detection (placeholder - would use image embeddings)
 */
export async function detectVisualBrandContent(
  contentItemId: string,
  imageUrl: string,
  brandLogos?: string[] // URLs to brand logo images
): Promise<DetectionResult[]> {
  // TODO: Implement visual similarity detection using:
  // - Image embeddings (OpenAI CLIP or similar)
  // - Logo detection
  // - Product visual matching
  return [];
}

/**
 * Behavior-based detection (tracks creator behavior patterns)
 */
export async function detectBehavioralBrandContent(
  creatorId: string,
  contentItemId: string
): Promise<DetectionResult[]> {
  // TODO: Implement behavior tracking:
  // - Creator frequently posts about certain brands
  // - Timing patterns
  // - Engagement patterns with brand content
  return [];
}

