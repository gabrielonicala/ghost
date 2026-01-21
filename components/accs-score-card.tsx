"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ACCSScore } from "@/lib/types";

interface ACCSScoreCardProps {
  score: ACCSScore;
}

export function ACCSScoreCard({ score }: ACCSScoreCardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 75) return "text-green-600";
    if (value >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getTierBadgeVariant = (tier: string) => {
    if (tier === "high") return "success";
    if (tier === "medium") return "warning";
    return "danger";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Conversion Confidence Score</span>
          <span className={`text-4xl font-bold ${getScoreColor(score.score)}`}>
            {score.score}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authenticity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Authenticity</span>
            <Badge variant={score.authenticity.level === "high" ? "success" : "default"}>
              {score.authenticity.level.toUpperCase()}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                score.authenticity.score >= 70
                  ? "bg-green-600"
                  : score.authenticity.score >= 50
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${score.authenticity.score}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Script Likelihood: {score.authenticity.scriptLikelihood.toFixed(0)}%
          </p>
        </div>

        {/* Audience Trust */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Audience Trust</span>
            <Badge variant="success">
              {score.audienceTrust.level.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                score.audienceTrust.score >= 70
                  ? "bg-green-600"
                  : score.audienceTrust.score >= 50
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${score.audienceTrust.score}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Purchase Intent: {score.audienceTrust.purchaseIntentConfidence.toFixed(0)}%
          </p>
        </div>

        {/* Promotion Saturation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Promotion Saturation</span>
            <Badge
              variant={
                score.promotionSaturation.level === "low"
                  ? "success"
                  : score.promotionSaturation.level === "medium"
                  ? "warning"
                  : "danger"
              }
            >
              {score.promotionSaturation.level.toUpperCase()}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                score.promotionSaturation.score >= 70
                  ? "bg-green-600"
                  : score.promotionSaturation.score >= 50
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${score.promotionSaturation.score}%` }}
            />
          </div>
        </div>

        {/* Fatigue Risk */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">UGC Fatigue Risk</span>
            <Badge
              variant={
                score.fatigueRisk.level === "low"
                  ? "success"
                  : score.fatigueRisk.level === "medium"
                  ? "warning"
                  : "danger"
              }
            >
              {score.fatigueRisk.level.toUpperCase()}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                score.fatigueRisk.score >= 70
                  ? "bg-green-600"
                  : score.fatigueRisk.score >= 50
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${score.fatigueRisk.score}%` }}
            />
          </div>
          {score.fatigueRisk.warnings.length > 0 && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ {score.fatigueRisk.warnings[0]}
            </p>
          )}
        </div>

        {/* Performance Tier */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Predicted Performance</span>
            <Badge variant={getTierBadgeVariant(score.predictedPerformanceTier)}>
              {score.predictedPerformanceTier.toUpperCase()} ROAS CANDIDATE
            </Badge>
          </div>
        </div>

        {/* Recommended Use */}
        <div>
          <p className="text-sm font-medium mb-2">Recommended Use:</p>
          <div className="flex flex-wrap gap-2">
            {score.recommendedUse.map((use) => (
              <Badge key={use} variant="secondary">
                {use.replace("_", " ").toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Key Factors */}
        {score.reasonAttribution.keyFactors.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Key Factors:</p>
            <ul className="text-xs space-y-1">
              {score.reasonAttribution.keyFactors.map((factor, idx) => (
                <li key={idx}>• {factor}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

