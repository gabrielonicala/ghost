"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import type { Platform } from "@/lib/types";

// Auto-detect platform from URL
function detectPlatformFromUrl(url: string): Platform | null {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes("tiktok.com")) return "tiktok";
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "youtube";
  if (lowerUrl.includes("instagram.com")) return "instagram";
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.watch")) return "facebook";
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return "twitter";
  
  return null;
}

export function AddContent() {
  const { organizationId } = useAuth();
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [contentIdOrUrl, setContentIdOrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  // Auto-detect platform when URL changes
  useEffect(() => {
    const detected = detectPlatformFromUrl(contentIdOrUrl);
    if (detected) {
      setPlatform(detected);
      setAutoDetected(true);
    } else if (contentIdOrUrl.trim() === "") {
      setAutoDetected(false);
    }
  }, [contentIdOrUrl]);

  const placeholder = "Paste any TikTok, YouTube, or Instagram URL";

  const submit = async () => {
    setMessage(null);

    const value = contentIdOrUrl.trim();
    if (!value) {
      setMessage("Please paste a content URL.");
      return;
    }

    if (!autoDetected) {
      setMessage("Could not detect platform from URL.");
      return;
    }

    if (!organizationId) {
      setMessage("Missing organizationId (are you logged in?)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/content/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          contentId: value,
          organizationId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data?.error || `Failed (${res.status})`);
        return;
      }

      setMessage("Added! Refreshing...");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setMessage(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // Get platform display info
  const platformInfo = useMemo(() => {
    const info: Record<Platform, { name: string; icon: string; color: string }> = {
      tiktok: { name: "TikTok", icon: "🎵", color: "bg-black text-white" },
      youtube: { name: "YouTube", icon: "▶️", color: "bg-red-600 text-white" },
      instagram: { name: "Instagram", icon: "📷", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
      facebook: { name: "Facebook", icon: "👤", color: "bg-blue-600 text-white" },
      twitter: { name: "X", icon: "𝕏", color: "bg-black text-white" },
    };
    return info[platform];
  }, [platform]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Paste a URL and we'll automatically detect the platform.
        </p>

        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <input
              value={contentIdOrUrl}
              onChange={(e) => setContentIdOrUrl(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              placeholder={placeholder}
              disabled={loading}
            />
          </div>
          
          {autoDetected && (
            <div className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${platformInfo.color}`}>
              <span>{platformInfo.icon}</span>
              <span>{platformInfo.name}</span>
            </div>
          )}
          
          <button
            onClick={submit}
            disabled={loading || !autoDetected}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

        {!autoDetected && contentIdOrUrl.trim() && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Could not detect platform. Supported: TikTok, YouTube, Instagram
          </p>
        )}

        {message && (
          <div
            className={`p-3 rounded text-sm ${
              message.includes("Added") || message.includes("Refreshing")
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}
          >
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
