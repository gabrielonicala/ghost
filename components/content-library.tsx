"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ACCSScoreCard } from "@/components/accs-score-card";
import { formatDate, formatNumber } from "@/lib/utils";
import type { ContentItemWithScores, ACCSScore } from "@/lib/types";
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  Heart, 
  MessageCircle, 
  Eye, 
  ExternalLink, 
  Filter,
  LayoutGrid,
  FileText,
  Sparkles,
  TrendingUp,
  Music2,
  X
} from "lucide-react";

function getPlatformLabel(platform: ContentItemWithScores["platform"]) {
  switch (platform) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "facebook":
      return "Facebook";
    case "twitter":
      return "X";
    default:
      return platform;
  }
}

function PlatformIcon({ platform }: { platform: ContentItemWithScores["platform"] }) {
  const cls = "h-3.5 w-3.5";
  switch (platform) {
    case "instagram":
      return <Instagram className={cls} />;
    case "youtube":
      return <Youtube className={cls} />;
    case "facebook":
      return <Facebook className={cls} />;
    case "twitter":
      return <X className={cls} />;
    case "tiktok":
      return <Music2 className={cls} />;
    default:
      return null;
  }
}

function getPlatformColor(platform: ContentItemWithScores["platform"]) {
  switch (platform) {
    case "tiktok":
      return "bg-black text-white";
    case "youtube":
      return "bg-red-600 text-white";
    case "instagram":
      return "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white";
    case "facebook":
      return "bg-blue-600 text-white";
    case "twitter":
      return "bg-black text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Proxy images through wsrv.nl to bypass hotlink protection and ensure proper loading
function getProxiedImageUrl(url: string): string {
  if (!url) return url;
  // wsrv.nl is a free image proxy that handles hotlink protection
  // fit=contain ensures aspect ratio is preserved
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&fit=contain&n=-1`;
}

function getScoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

function getScoreGradient(score: number): string {
  if (score >= 75) return "from-emerald-500 to-green-400";
  if (score >= 50) return "from-amber-500 to-yellow-400";
  return "from-red-500 to-rose-400";
}

export function ContentLibrary() {
  const [contentItems, setContentItems] = useState<ContentItemWithScores[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchContent();
  }, [minScore]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (minScore !== undefined) {
        params.append("minScore", minScore.toString());
      }
      const response = await fetch(`/api/content?${params.toString()}`);
      const data = await response.json();
      
      // Transform API response to match ContentItemWithScores type
      const transformed = (data.contentItems || []).map((item: any) => {
        // Get the latest metrics snapshot (sort by snapshotAt descending)
        const sortedMetrics = [...(item.metricsSnapshots || [])].sort(
          (a: any, b: any) => new Date(b.snapshotAt).getTime() - new Date(a.snapshotAt).getTime()
        );
        const latestMetrics = sortedMetrics[0] || {};
        
        return {
          id: item.id,
          platform: item.platform,
          contentType: item.contentType,
          mediaUrl: item.mediaUrl,
          thumbnailUrl: item.thumbnailUrl,
          caption: item.caption,
          publishedAt: new Date(item.publishedAt),
          creator: {
            id: item.creator.id,
            username: item.creator.username,
            displayName: item.creator.displayName,
          },
          // Metrics (likes, comments, views)
          metrics: {
            views: latestMetrics.views || null,
            likes: latestMetrics.likes || null,
            comments: latestMetrics.comments || null,
            shares: latestMetrics.shares || null,
          },
          // Include OCR and transcript data (sorted by newest, deduplicated in display)
          ocrFrames: item.ocrFrames || [],
          transcripts: [...(item.transcripts || [])].sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, 1), // Only keep the latest transcript
        accsScore: item.conversionScores?.[0] ? {
          score: item.conversionScores[0].score,
          authenticity: {
            score: item.conversionScores[0].authenticityScore,
            level: item.authenticitySignals?.[0]?.score >= 70 ? "high" : item.authenticitySignals?.[0]?.score >= 50 ? "medium" : "low",
            scriptLikelihood: item.authenticitySignals?.[0]?.scriptLikelihood || 0,
            reusedHookDetected: item.authenticitySignals?.[0]?.reusedHookDetected || false,
            reasons: [],
          },
          audienceTrust: {
            score: item.conversionScores[0].audienceTrustScore,
            level: item.trustMetrics?.[0]?.trustIndex >= 80 ? "very_high" : item.trustMetrics?.[0]?.trustIndex >= 65 ? "high" : item.trustMetrics?.[0]?.trustIndex >= 40 ? "medium" : "low",
            engagementQualityGrade: item.trustMetrics?.[0]?.engagementQualityGrade || "C",
            purchaseIntentConfidence: item.trustMetrics?.[0]?.purchaseIntentConfidence || 0,
          },
          promotionSaturation: {
            score: item.conversionScores[0].promotionSaturationScore,
            level: "low",
            density: 0,
            riskLevel: "low",
          },
          fatigueRisk: {
            score: item.conversionScores[0].fatigueRiskScore,
            level: "low",
            originalityPercentile: 0,
            warnings: [],
          },
          predictedPerformanceTier: item.conversionScores[0].predictedPerformanceTier || "medium",
          recommendedUse: item.conversionScores[0].recommendedUse || [],
          confidenceInterval: item.conversionScores[0].confidenceInterval || { lower: 0, upper: 100 },
          reasonAttribution: item.conversionScores[0].reasonAttribution || { strengths: [], weaknesses: [], keyFactors: [] },
        } : undefined,
        };
      });
      
      setContentItems(transformed);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedContent = contentItems.find((item) => item.id === selectedItem);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Content Grid */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Content Library</h2>
              <p className="text-sm text-muted-foreground">
                {contentItems.length} {contentItems.length === 1 ? "item" : "items"} analyzed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Min Score:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={minScore || ""}
                onChange={(e) =>
                  setMinScore(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-16 px-2 py-1 bg-transparent border-none text-sm text-foreground focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-6 rounded-full skeleton" />
                    <div className="w-12 h-8 rounded skeleton" />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="w-32 h-5 rounded skeleton" />
                    <div className="w-24 h-4 rounded skeleton" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-48 rounded-lg skeleton mb-3" />
                  <div className="flex gap-4 mb-2">
                    <div className="w-16 h-4 rounded skeleton" />
                    <div className="w-16 h-4 rounded skeleton" />
                  </div>
                  <div className="w-full h-4 rounded skeleton" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : contentItems.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <LayoutGrid className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No content yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Add your first piece of creator content above to start analyzing conversion potential.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentItems.map((item) => (
              <Card
                key={item.id}
                hover
                className={`overflow-hidden cursor-pointer ${
                  selectedItem === item.id 
                    ? "ring-2 ring-primary border-primary" 
                    : ""
                }`}
                onClick={() => setSelectedItem(item.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPlatformColor(item.platform)}`}>
                      <PlatformIcon platform={item.platform} />
                      {getPlatformLabel(item.platform)}
                    </div>
                    {item.accsScore && (
                      <div className={`text-2xl font-bold bg-gradient-to-r ${getScoreGradient(item.accsScore.score)} bg-clip-text text-transparent`}>
                        {item.accsScore.score}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5 pt-1">
                    <CardTitle className="text-base leading-tight">
                      {item.creator.displayName || `@${item.creator.username}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      @{item.creator.username}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Clickable thumbnail - opens original video */}
                  {/* IMPORTANT: Thumbnail display logic preserved as requested */}
                  <a 
                    href={item.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block relative group"
                  >
                    <div className="relative w-full h-48 bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <>
                          <img
                            src={getProxiedImageUrl(item.thumbnailUrl)}
                            alt={`${getPlatformLabel(item.platform)} thumbnail`}
                            className="h-full w-auto max-w-full object-contain group-hover:opacity-80 transition-opacity"
                            loading="lazy"
                            onError={(e) => {
                              // Hide broken image and show fallback
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="hidden items-center justify-center text-muted-foreground text-sm">
                            <span>Image unavailable</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">No thumbnail</span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-full text-sm font-medium text-foreground">
                          <ExternalLink className="h-4 w-4" />
                          View Original
                        </div>
                      </div>
                    </div>
                  </a>
                  
                  {/* Metrics row - likes, comments, views */}
                  {(item.metrics?.likes || item.metrics?.comments || item.metrics?.views) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {item.metrics.views && (
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          {formatNumber(item.metrics.views)}
                        </span>
                      )}
                      {item.metrics.likes && (
                        <span className="flex items-center gap-1.5">
                          <Heart className="h-4 w-4" />
                          {formatNumber(item.metrics.likes)}
                        </span>
                      )}
                      {item.metrics.comments && (
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="h-4 w-4" />
                          {formatNumber(item.metrics.comments)}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {item.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.caption}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.publishedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Score Details Sidebar */}
      <div className="space-y-4">
        {selectedContent && selectedContent.accsScore ? (
          <>
            <ACCSScoreCard score={selectedContent.accsScore} />
            
            {/* Extracted Text Section */}
            {((selectedContent.ocrFrames && selectedContent.ocrFrames.length > 0) || 
              (selectedContent.transcripts && selectedContent.transcripts.length > 0)) && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Extracted Text</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* OCR Text */}
                  {selectedContent.ocrFrames && selectedContent.ocrFrames.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        OCR Text (from image)
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg text-sm text-foreground max-h-48 overflow-y-auto border border-border">
                        {selectedContent.ocrFrames.map((frame: any, idx: number) => (
                          <div key={idx} className="mb-2 last:mb-0">
                            {frame.text && (
                              <>
                                <p className="whitespace-pre-wrap">{frame.text}</p>
                                {frame.confidence && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Confidence: {(frame.confidence * 100).toFixed(1)}%
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Transcript - deduplicated */}
                  {selectedContent.transcripts && selectedContent.transcripts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                        Transcript (from video/audio)
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg text-sm text-foreground max-h-48 overflow-y-auto border border-border">
                        {(() => {
                          // Deduplicate transcripts by text content
                          const seen = new Set<string>();
                          const uniqueTranscripts = selectedContent.transcripts.filter((t: any) => {
                            const normalized = t.text?.trim().toLowerCase();
                            if (!normalized || seen.has(normalized)) return false;
                            seen.add(normalized);
                            return true;
                          });
                          
                          return uniqueTranscripts.map((transcript: any, idx: number) => (
                            <div key={idx}>
                              <p className="whitespace-pre-wrap">{transcript.text}</p>
                              {transcript.language && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Language: {transcript.language}
                                </p>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {(!selectedContent.ocrFrames || selectedContent.ocrFrames.length === 0) &&
                   (!selectedContent.transcripts || selectedContent.transcripts.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No extracted text available yet. Processing may still be in progress.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : selectedContent ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Score Not Available</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This content hasn't been scored yet. Click below to calculate the ACCS score.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/content/${selectedContent.id}/score`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        organizationId: "clx0000000000000000000000" // TODO: Get from user context
                      }),
                    });
                    if (response.ok) {
                      // Refresh content
                      fetchContent();
                    } else {
                      alert("Failed to calculate score");
                    }
                  } catch (error) {
                    alert("Error calculating score");
                  }
                }}
                className="w-full"
              >
                <TrendingUp className="w-4 h-4" />
                Calculate ACCS Score
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="sticky top-24">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Select Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click on a content item to view its ACCS score and detailed analysis.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">What is ACCS?</h4>
                <p className="text-xs text-muted-foreground">
                  The Authenticity & Conversion Confidence Score predicts how well creator content will perform as paid ads based on authenticity, audience trust, and fatigue signals.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
