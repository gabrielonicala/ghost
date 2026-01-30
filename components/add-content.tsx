"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import type { Platform } from "@/lib/types";

export function AddContent() {
  const { organizationId } = useAuth();
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [contentIdOrUrl, setContentIdOrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const placeholder = useMemo(() => {
    switch (platform) {
      case "tiktok":
        return "https://www.tiktok.com/@username/video/1234567890";
      case "youtube":
        return "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      case "instagram":
        return "https://www.instagram.com/reel/XXXXXXXXXXX/";
      case "facebook":
        return "https://www.facebook.com/.../videos/...";
      case "twitter":
        return "https://x.com/.../status/...";
      default:
        return "Paste a content URL or ID";
    }
  }, [platform]);

  const submit = async () => {
    setMessage(null);

    const value = contentIdOrUrl.trim();
    if (!value) {
      setMessage("❌ Please paste a content URL (or ID).");
      return;
    }

    if (!organizationId) {
      setMessage("❌ Missing organizationId (are you logged in?)");
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
        setMessage(`❌ ${data?.error || `Failed (${res.status})`}`);
        return;
      }

      setMessage("✅ Added! Refreshing…");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setMessage(`❌ ${err?.message || "Request failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Paste a platform URL and we’ll ingest it (TikTok uses Apify).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1 text-foreground">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              disabled={loading}
            >
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="instagram" disabled>
                Instagram (soon)
              </option>
              <option value="facebook" disabled>
                Facebook (soon)
              </option>
              <option value="twitter" disabled>
                X (soon)
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-foreground">
              Content URL (or ID)
            </label>
            <input
              value={contentIdOrUrl}
              onChange={(e) => setContentIdOrUrl(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              placeholder={placeholder}
              disabled={loading}
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Adding…" : "Add content"}
        </button>

        {message && (
          <div
            className={`p-3 rounded text-sm ${
              message.includes("✅")
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

