"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACCSScoreCard } from "@/components/accs-score-card";
import { formatDate, formatNumber } from "@/lib/utils";
import type { ContentItemWithScores, ACCSScore } from "@/lib/types";

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
      const transformed = (data.contentItems || []).map((item: any) => ({
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
      }));
      
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
                    <Badge variant="secondary">{item.platform}</Badge>
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
                  <CardTitle className="text-lg">
                    @{item.creator.username}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt="Content thumbnail"
                      className="w-full h-48 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded mb-2 flex items-center justify-center text-muted-foreground">
                      No thumbnail
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
      <div>
        {selectedContent && selectedContent.accsScore ? (
          <ACCSScoreCard score={selectedContent.accsScore} />
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

