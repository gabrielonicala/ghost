"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import type { Platform } from "@/lib/types";
import { Link2, Plus, CheckCircle2, AlertCircle } from "lucide-react";

// Platform icons as SVG components for better quality
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
      setMessage({ type: "error", text: "Please paste a content URL." });
      return;
    }

    if (!autoDetected) {
      setMessage({ type: "error", text: "Could not detect platform from URL." });
      return;
    }

    if (!organizationId) {
      setMessage({ type: "error", text: "Missing organizationId (are you logged in?)" });
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
        setMessage({ type: "error", text: data?.error || `Failed (${res.status})` });
        return;
      }

      setMessage({ type: "success", text: "Content added successfully! Refreshing..." });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  // Get platform display info
  const platformInfo = useMemo(() => {
    const info: Record<Platform, { name: string; icon: React.ReactNode; bgClass: string }> = {
      tiktok: { 
        name: "TikTok", 
        icon: <TikTokIcon />, 
        bgClass: "bg-black text-white" 
      },
      youtube: { 
        name: "YouTube", 
        icon: <YouTubeIcon />, 
        bgClass: "bg-red-600 text-white" 
      },
      instagram: { 
        name: "Instagram", 
        icon: <InstagramIcon />, 
        bgClass: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white" 
      },
      facebook: { 
        name: "Facebook", 
        icon: <span className="text-sm">f</span>, 
        bgClass: "bg-blue-600 text-white" 
      },
      twitter: { 
        name: "X", 
        icon: <span className="text-sm font-bold">𝕏</span>, 
        bgClass: "bg-black text-white" 
      },
    };
    return info[platform];
  }, [platform]);

  return (
    <Card className="mb-8" variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Add Content</CardTitle>
            <CardDescription>
              Paste a URL and we'll automatically detect the platform
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* URL Input */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              value={contentIdOrUrl}
              onChange={(e) => setContentIdOrUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm transition-all duration-200 placeholder:text-muted-foreground hover:border-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder={placeholder}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          
          {/* Platform Badge */}
          {autoDetected && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${platformInfo.bgClass} shadow-sm`}>
              {platformInfo.icon}
              <span>{platformInfo.name}</span>
            </div>
          )}
          
          {/* Submit Button */}
          <Button
            onClick={submit}
            disabled={loading || !autoDetected}
            loading={loading}
            size="lg"
            className="sm:w-auto"
          >
            {loading ? "Adding..." : "Analyze"}
          </Button>
        </div>

        {/* Warning for undetected platform */}
        {!autoDetected && contentIdOrUrl.trim() && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Could not detect platform. Supported: TikTok, YouTube, Instagram</span>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm animate-fade-in ${
              message.type === "success"
                ? "bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)]"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Supported Platforms */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">Supported:</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-black text-white">
              <TikTokIcon />
            </div>
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-red-600 text-white">
              <YouTubeIcon />
            </div>
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white">
              <InstagramIcon />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
