"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TestMediaProcessing() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [contentType, setContentType] = useState<"image" | "video">("image");

  const testOCR = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/content/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "instagram",
          username: `test_creator_${Math.floor(Math.random() * 1000)}`,
          caption: "Test image with text for OCR",
          mediaUrl: mediaUrl || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
          contentType: "image",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Content created! Content ID: ${data.contentItemId}. Check Inngest dashboard for processing.`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTranscription = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/content/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "youtube",
          username: `test_creator_${Math.floor(Math.random() * 1000)}`,
          caption: "Test video for transcription",
          mediaUrl: mediaUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          contentType: "video",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Content created! Content ID: ${data.contentItemId}. Check Inngest dashboard for transcription.`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Test Media Processing</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Test OCR, transcription, and visual embeddings with real media URLs.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="mediaUrl" className="block text-sm font-medium mb-1 text-foreground">
              Media URL (image or video)
            </label>
            <input
              id="mediaUrl"
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="https://example.com/image.jpg or https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Test Type</label>
            <div className="flex gap-4">
              <button
                onClick={testOCR}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Test OCR (Image)"}
              </button>
              <button
                onClick={testTranscription}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Test Transcription (Video)"}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${
              message.includes("✅") 
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" 
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}>
              {message}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>OCR Test:</strong> Use an image URL with visible text (e.g., product images, memes with text)</p>
            <p><strong>Transcription:</strong> YouTube uses captions when available. TikTok/Instagram/Facebook use Apify (if configured)</p>
            <p><strong>Supported URLs:</strong> YouTube, TikTok, Instagram Reels, Facebook Videos, or direct video file URLs</p>
            <p><strong>Check Results:</strong> Go to Inngest Dashboard → Monitor → Runs to see processing steps</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



