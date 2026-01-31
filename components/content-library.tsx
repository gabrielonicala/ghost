"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACCSScoreCard } from "@/components/accs-score-card";
import { formatDate, formatNumber } from "@/lib/utils";
import type { ContentItemWithScores, ACCSScore } from "@/lib/types";
import { Instagram, Youtube, Facebook, X, Music2, Heart, MessageCircle, Eye, ExternalLink } from "lucide-react";

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

// Proxy images through wsrv.nl to bypass hotlink protection and ensure proper loading
function getProxiedImageUrl(url: string): string {
  if (!url) return url;
  // wsrv.nl is a free image proxy that handles hotlink protection
  // fit=contain ensures aspect ratio is preserved
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&fit=contain&n=-1`;
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
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Content Library</h2>
          <div className="flex items-center gap-4">
            <label className="text-sm">
              Min Score:
              <input
                type="number"
                min="0"
                max="100"
                value={minScore || ""}
                onChange={(e) =>
                  setMinScore(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="ml-2 px-2 py-1 border rounded"
              />
            </label>
          </div>
        </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : contentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content items found
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentItems.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  selectedItem === item.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedItem(item.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1">
                      <PlatformIcon platform={item.platform} />
                      {getPlatformLabel(item.platform)}
                    </Badge>
                    {item.accsScore && (
                      <div
                        className={`text-2xl font-bold ${
                          item.accsScore.score >= 75
                            ? "text-green-600"
                            : item.accsScore.score >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.accsScore.score}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-tight">
                      {item.creator.displayName || `@${item.creator.username}`}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      @{item.creator.username}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Clickable thumbnail - opens original video */}
                  <a 
                    href={item.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block relative group"
                  >
                    <div className="relative w-full h-48 bg-muted rounded mb-2 overflow-hidden flex items-center justify-center">
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
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <ExternalLink className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </a>
                  
                  {/* Metrics row - likes, comments, views */}
                  {(item.metrics?.likes || item.metrics?.comments || item.metrics?.views) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      {item.metrics.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {formatNumber(item.metrics.views)}
                        </span>
                      )}
                      {item.metrics.likes && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {formatNumber(item.metrics.likes)}
                        </span>
                      )}
                      {item.metrics.comments && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
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
                <CardHeader>
                  <CardTitle>Extracted Text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* OCR Text */}
                  {selectedContent.ocrFrames && selectedContent.ocrFrames.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-foreground">
                        OCR Text (from image)
                      </h4>
                      <div className="bg-muted p-3 rounded text-sm text-foreground max-h-48 overflow-y-auto">
                        {selectedContent.ocrFrames.map((frame: any, idx: number) => (
                          <div key={idx} className="mb-2">
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
                      <h4 className="text-sm font-medium mb-2 text-foreground">
                        Transcript (from video/audio)
                      </h4>
                      <div className="bg-muted p-3 rounded text-sm text-foreground max-h-48 overflow-y-auto">
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
              <CardTitle>No Score Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This content item hasn't been scored yet. Click the button below to calculate the ACCS score.
              </p>
              <button
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
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Calculate ACCS Score
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Select Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click on a content item to view its ACCS score and analysis.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

