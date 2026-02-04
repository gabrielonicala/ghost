"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ghost, 
  TrendingUp, 
  Shield, 
  Zap, 
  Brain,
  Search,
  BarChart3,
  Target,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ScanLine,
  MessageSquare,
  Megaphone,
  AlertTriangle,
  Play,
  Star,
  Quote
} from "lucide-react";
import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg shadow-primary/20">
                <Ghost className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  Ghost
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Creator Intelligence
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Creator Analytics
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8">
              Not all UGC{" "}
              <span className="text-gradient">converts.</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl text-muted-foreground font-medium">
                We tell you which content actually will.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Ghost analyzes creator content to predict conversion potential before you spend your ad budget. 
              Make data-driven decisions with our Authenticity & Conversion Confidence Score (ACCS).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto mt-16">
              <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
                <TrendingUp className="w-6 h-6 text-[var(--success)] mb-3" />
                <span className="text-3xl sm:text-4xl font-bold text-foreground">87%</span>
                <span className="text-sm text-muted-foreground mt-1">Prediction Accuracy</span>
              </div>
              <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
                <Target className="w-6 h-6 text-primary mb-3" />
                <span className="text-3xl sm:text-4xl font-bold text-foreground">2.4x</span>
                <span className="text-sm text-muted-foreground mt-1">Better ROAS</span>
              </div>
              <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
                <Zap className="w-6 h-6 text-[var(--warning)] mb-3" />
                <span className="text-3xl sm:text-4xl font-bold text-foreground">5min</span>
                <span className="text-sm text-muted-foreground mt-1">Analysis Time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Stop guessing. Start converting.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Archive shows you what creators posted. We show you what will make money.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Authenticity Detection
                </h3>
                <p className="text-sm text-muted-foreground">
                  Detect scripted vs. genuine content using transcript entropy, phrase reuse, and natural speech patterns.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--success)]/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[var(--success)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Audience Trust Signals
                </h3>
                <p className="text-sm text-muted-foreground">
                  Analyze comment sentiment, purchase intent keywords, and engagement quality to measure real audience trust.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--info)]/10 flex items-center justify-center mb-4">
                  <Megaphone className="w-6 h-6 text-[var(--info)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Promotion Saturation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track creator ad fatigue with promotion density metrics and sponsored-content spacing analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-[var(--warning)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  UGC Fatigue Detection
                </h3>
                <p className="text-sm text-muted-foreground">
                  Identify creative exhaustion with hook pattern analysis and visual similarity detection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              From content to conversion intelligence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered pipeline analyzes every piece of creator content to predict its commercial potential.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: Search,
                title: "Content Ingestion",
                description: "Paste any TikTok, YouTube, or Instagram URL. We automatically detect and ingest the content."
              },
              {
                step: "02",
                icon: ScanLine,
                title: "Media Processing",
                description: "Extract frames, transcribe audio, and run OCR to capture every visual and textual element."
              },
              {
                step: "03",
                icon: Brain,
                title: "Signal Analysis",
                description: "Analyze authenticity, audience trust, promotion density, and fatigue signals using AI."
              },
              {
                step: "04",
                icon: BarChart3,
                title: "ACCS Scoring",
                description: "Receive a 0-100 Conversion Confidence Score with detailed breakdowns and recommendations."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-primary mb-2">{item.step}</span>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px">
                    <div className="w-full h-px bg-gradient-to-r from-border to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACCS Score Explanation */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">The ACCS Score</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                One score to predict conversion potential
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                The Authenticity & Conversion Confidence Score (ACCS) is a 0-100 predictive metric that estimates a content item's likelihood to drive real commercial outcomes.
              </p>

              <div className="space-y-4">
                {[
                  { label: "Authenticity", desc: "Detects genuine vs. scripted content", color: "bg-primary" },
                  { label: "Audience Trust", desc: "Measures engagement quality and purchase intent", color: "bg-[var(--success)]" },
                  { label: "Promotion Saturation", desc: "Tracks creator ad fatigue levels", color: "bg-[var(--info)]" },
                  { label: "UGC Fatigue Risk", desc: "Identifies overused creative patterns", color: "bg-[var(--warning)]" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className={`w-2 h-2 rounded-full ${item.color} mt-2`} />
                    <div>
                      <h4 className="font-semibold text-foreground">{item.label}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-[var(--gradient-end)]/20 rounded-3xl blur-3xl" />
              <Card className="relative" variant="elevated">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Conversion Confidence</p>
                      <h3 className="text-lg font-semibold">ACCS Score</h3>
                    </div>
                    <div className="text-5xl font-bold text-gradient">87</div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {[
                      { label: "Authenticity", value: 92, color: "from-emerald-500 to-green-400" },
                      { label: "Audience Trust", value: 88, color: "from-emerald-500 to-green-400" },
                      { label: "Promotion Saturation", value: 75, color: "from-amber-500 to-yellow-400" },
                      { label: "Fatigue Risk", value: 82, color: "from-emerald-500 to-green-400" }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                      <span className="text-sm font-semibold text-[var(--success)]">HIGH ROAS CANDIDATE</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended for: Paid Social Ads, Homepage Placement, Email Campaigns
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to make smarter decisions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Untagged Brand Detection",
                description: "Find brand mentions even without @tags or hashtags using OCR, transcription, and visual analysis."
              },
              {
                icon: Users,
                title: "Creator CRM",
                description: "Track creator performance history, promotion density, and audience trust profiles over time."
              },
              {
                icon: Target,
                title: "Campaign Management",
                description: "Organize content by campaign, track deliverables, and compare creator performance."
              },
              {
                icon: BarChart3,
                title: "Performance Forecasting",
                description: "Predict which content will perform best before spending your ad budget."
              },
              {
                icon: MessageSquare,
                title: "Comment Analysis",
                description: "Extract purchase intent signals from comment sentiment and question density."
              },
              {
                icon: Sparkles,
                title: "Explainable AI",
                description: "Understand exactly why content scores high or low with detailed reasoning."
              }
            ].map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by growth teams
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Ghost helped us identify high-converting creator content we would have otherwise missed. Our ROAS improved by 3x.",
                author: "Sarah Chen",
                role: "Head of Growth, DTC Brand"
              },
              {
                quote: "The ACCS score is now a core part of our content selection process. It's like having a data scientist on the team.",
                author: "Marcus Johnson",
                role: "Performance Marketing Lead"
              },
              {
                quote: "We stopped wasting budget on content that looked good but didn't convert. Ghost pays for itself.",
                author: "Emily Rodriguez",
                role: "CMO, E-commerce Startup"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  <p className="text-foreground mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-white font-semibold">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] p-12 lg:p-16 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to stop guessing?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join hundreds of brands using Ghost to identify high-converting creator content before they spend a dollar on ads.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="gap-2 bg-white text-primary hover:bg-white/90">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Free tier available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
                <Ghost className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">Ghost</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ghost. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
