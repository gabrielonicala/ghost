"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ACCSScore } from "@/lib/types";
import { 
  TrendingUp, 
  Shield, 
  Users, 
  Megaphone, 
  AlertTriangle,
  Sparkles,
  Target,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface ACCSScoreCardProps {
  score: ACCSScore;
}

export function ACCSScoreCard({ score }: ACCSScoreCardProps) {
  const getScoreGradient = (value: number) => {
    if (value >= 75) return "from-emerald-500 to-green-400";
    if (value >= 50) return "from-amber-500 to-yellow-400";
    return "from-red-500 to-rose-400";
  };

  const getProgressColor = (value: number) => {
    if (value >= 70) return "success";
    if (value >= 50) return "warning";
    return "danger";
  };

  const getTierConfig = (tier: string) => {
    if (tier === "high") return { variant: "success" as const, label: "HIGH ROAS CANDIDATE", icon: TrendingUp };
    if (tier === "medium") return { variant: "warning" as const, label: "MEDIUM ROAS CANDIDATE", icon: Target };
    return { variant: "danger" as const, label: "LOW ROAS CANDIDATE", icon: AlertTriangle };
  };

  const tierConfig = getTierConfig(score.predictedPerformanceTier);

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header with main score */}
      <div className="relative bg-gradient-to-br from-card to-muted/30 p-6 border-b border-border">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Conversion Confidence
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">ACCS Score</h3>
          </div>
          
          <div className="text-right">
            <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreGradient(score.score)} bg-clip-text text-transparent`}>
              {score.score}
            </div>
            <span className="text-xs text-muted-foreground">out of 100</span>
          </div>
        </div>

        {/* Performance Tier Badge */}
        <div className="mt-4">
          <Badge variant={tierConfig.variant} className="gap-1.5">
            <tierConfig.icon className="w-3 h-3" />
            {tierConfig.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 space-y-5">
        {/* Authenticity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Authenticity</span>
            </div>
            <Badge variant={score.authenticity.level === "high" ? "success" : score.authenticity.level === "medium" ? "warning" : "danger"} size="sm">
              {score.authenticity.level.toUpperCase()}
            </Badge>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressColor(score.authenticity.score)}`}
              style={{ width: `${score.authenticity.score}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Script Likelihood: {score.authenticity.scriptLikelihood.toFixed(0)}%
            {score.authenticity.reusedHookDetected && (
              <span className="text-[var(--warning)] ml-2">• Reused hook detected</span>
            )}
          </p>
        </div>

        {/* Audience Trust */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--success)]/10">
                <Users className="w-4 h-4 text-[var(--success)]" />
              </div>
              <span className="text-sm font-medium text-foreground">Audience Trust</span>
            </div>
            <Badge variant={score.audienceTrust.level === "very_high" || score.audienceTrust.level === "high" ? "success" : score.audienceTrust.level === "medium" ? "warning" : "danger"} size="sm">
              {score.audienceTrust.level.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressColor(score.audienceTrust.score)}`}
              style={{ width: `${score.audienceTrust.score}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Purchase Intent: {score.audienceTrust.purchaseIntentConfidence.toFixed(0)}%</span>
            <span>Grade: {score.audienceTrust.engagementQualityGrade}</span>
          </div>
        </div>

        {/* Promotion Saturation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--info)]/10">
                <Megaphone className="w-4 h-4 text-[var(--info)]" />
              </div>
              <span className="text-sm font-medium text-foreground">Promotion Saturation</span>
            </div>
            <Badge
              variant={
                score.promotionSaturation.level === "low"
                  ? "success"
                  : score.promotionSaturation.level === "medium"
                  ? "warning"
                  : "danger"
              }
              size="sm"
            >
              {score.promotionSaturation.level.toUpperCase()}
            </Badge>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressColor(score.promotionSaturation.score)}`}
              style={{ width: `${score.promotionSaturation.score}%` }}
            />
          </div>
        </div>

        {/* Fatigue Risk */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--warning)]/10">
                <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
              </div>
              <span className="text-sm font-medium text-foreground">UGC Fatigue Risk</span>
            </div>
            <Badge
              variant={
                score.fatigueRisk.level === "low"
                  ? "success"
                  : score.fatigueRisk.level === "medium"
                  ? "warning"
                  : "danger"
              }
              size="sm"
            >
              {score.fatigueRisk.level.toUpperCase()}
            </Badge>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${getProgressColor(score.fatigueRisk.score)}`}
              style={{ width: `${score.fatigueRisk.score}%` }}
            />
          </div>
          {score.fatigueRisk.warnings.length > 0 && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {score.fatigueRisk.warnings[0]}
            </p>
          )}
        </div>

        <div className="divider" />

        {/* Recommended Use */}
        {score.recommendedUse.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Recommended Use
            </p>
            <div className="flex flex-wrap gap-2">
              {score.recommendedUse.map((use) => (
                <Badge key={use} variant="secondary" size="sm">
                  {use.replace(/_/g, " ").toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Factors */}
        {(score.reasonAttribution.strengths.length > 0 || score.reasonAttribution.weaknesses.length > 0) && (
          <div className="space-y-3">
            {score.reasonAttribution.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                  Strengths
                </p>
                <ul className="space-y-1">
                  {score.reasonAttribution.strengths.slice(0, 3).map((strength, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[var(--success)] mt-1.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {score.reasonAttribution.weaknesses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Areas for Improvement
                </p>
                <ul className="space-y-1">
                  {score.reasonAttribution.weaknesses.slice(0, 3).map((weakness, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Key Factors (if available) */}
        {score.reasonAttribution.keyFactors.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-medium text-foreground mb-2">Key Factors</p>
            <ul className="space-y-1">
              {score.reasonAttribution.keyFactors.slice(0, 4).map((factor, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Interval */}
        {score.confidenceInterval && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            Confidence Range: {score.confidenceInterval.lower} - {score.confidenceInterval.upper}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
