# Project: Creator Intelligence & UGC Performance Platform
(Archive-class product with conversion intelligence differentiation)

---

## 1. Product Vision

Build an end-to-end creator intelligence platform that:

- Ingests and organizes creator-generated content
- Detects brand-relevant content beyond tags
- Analyzes authenticity, audience trust, promotional saturation, and fatigue
- Predicts which content will perform best in paid ads and on-site placement
- Guides brands toward higher ROAS decisions

This platform does not merely manage UGC.

It functions as a **decision engine for creator-driven growth**.

---

## 2. Core Value Proposition

> “Not all UGC converts.  
> We tell you which content actually will — before you spend money.”

---

## 3. Primary Capabilities

### A. Influencer & Creator Intelligence
- Creator CRM with performance history
- Cross-platform identity resolution
- Promotion density tracking
- Audience trust profiling
- Historical content analysis
- Creator authenticity scoring

### B. Campaign Management
- Campaign briefs and creator assignments
- Deliverable tracking
- Automated ingestion of creator content
- Performance attribution per campaign
- Comparative creator benchmarking

### C. Unified UGC Content Library
- Multi-platform content ingestion
- Media normalization and storage
- Version tracking and deduplication
- Engagement time-series snapshots
- Searchable by signals, scores, and outcomes

### D. Untagged Brand Content Detection
Brand content discovery using:

- Caption text analysis
- Audio transcription analysis
- OCR on video frames and images
- Visual similarity detection
- Creator behavior tracking
- Keyword and product dictionaries

Content is detected even without:
- @mentions
- hashtags
- direct brand references

---

## 4. Differentiating System:
# Authenticity & Conversion Confidence Score (ACCS)

Every content item receives a **0–100 predictive score** estimating its likelihood to drive real commercial outcomes.

This score is the central product primitive.

---

## 5. ACCS Core Dimensions

### 5.1 Authenticity Intelligence

Detects whether content appears genuine or scripted.

Signals include:

- Transcript entropy (natural vs templated speech)
- Phrase reuse across multiple promotions
- Creator-specific script repetition
- Presence of unnatural pacing
- Brand mention timing (early vs forced)
- Hook originality vs trend replication
- Visual continuity and natural product interaction

Outputs:
- Authenticity Score (0–100)
- Script likelihood %
- Reused hook detection
- Reason breakdown

---

### 5.2 Audience Trust Signals

Derived from public engagement behavior:

- Comment sentiment polarity
- Question density (“where did you get this?”)
- Purchase-intent keywords
- Repeat commenter frequency
- Save-to-view ratio
- Reply depth analysis
- Ratio of emoji-to-text comments

Outputs:
- Audience Trust Index
- Engagement Quality Grade
- Purchase Intent Confidence

---

### 5.3 Promotion Saturation Index

Measures creator ad fatigue.

Computed from:

- Promotional post ratio (30/60/90 days)
- Number of competing brands promoted
- Category overlap frequency
- Promotion clustering detection
- Sponsored-content spacing analysis

Outputs:
- Creator Promotion Density %
- Saturation Risk Level
- Recommended cooldown windows

---

### 5.4 UGC Fatigue Detection Engine

Detects creative exhaustion across platforms:

- Structural similarity to prior ads
- Hook pattern reuse frequency
- Visual composition overlap
- Audio trend saturation
- Brand-level repetition
- Industry-level creative exhaustion signals

Outputs:
- Fatigue Risk Score
- Creative originality percentile
- “Overused format” warnings

---

### 5.5 Historical Outcome Learning

When integrations are connected:

- Shopify conversions
- Meta Ads performance
- TikTok Ads performance
- GA4 events

The system learns correlations between:

- Video structure
- Speech cadence
- Hook type
- Creator style
- Duration patterns

Used to recalibrate scoring weights continuously.

---

## 6. Final ACCS Output

Each content item receives:

Conversion Confidence Score: 87 / 100

Authenticity: High
Audience Trust: Very High
Promotion Saturation: Low
UGC Fatigue Risk: Low

Predicted Performance Tier:
🟢 High ROAS Candidate

Recommended Use:
✓ Paid Social Ads
✓ Homepage Placement
✓ Email Campaigns

Scores are explainable with visible reasoning.

---

## 7. System Architecture

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind + shadcn/ui
- Server Components for analytics-heavy views

### Backend
- Next.js Route Handlers
- Prisma ORM
- Postgres (Neon / Supabase)
- Upstash Redis
- Inngest for durable background workflows

### Media Storage
- Cloudflare R2 or S3
- CDN delivery
- Frame extraction microservice

### Compute Extensions
- Whisper (speech-to-text)
- OCR (EasyOCR)
- Embeddings (OpenAI or local)
- Similarity search (pgvector)

---

## 8. Data Model (Expanded)

### Content Intelligence Tables

- content_items
- content_metrics_snapshots
- content_transcripts
- content_ocr_frames
- content_visual_features
- content_similarity_hashes

### ACCS Tables

- authenticity_signals
- audience_trust_metrics
- promotion_density_metrics
- ugc_fatigue_metrics
- conversion_confidence_scores

Each stored historically for score evolution.

---

## 9. Processing Pipeline

### 1. Content Ingestion
- Platform adapters normalize data
- Deduplication and identity resolution

### 2. Media Processing
- Thumbnail extraction
- Frame sampling
- Audio extraction

### 3. Intelligence Layer
- OCR text extraction
- Speech transcription
- NLP semantic embedding
- Visual similarity hashing

### 4. Signal Computation
- Authenticity metrics
- Audience trust metrics
- Promotion density metrics
- Fatigue detection metrics

### 5. Score Synthesis
- Weighted scoring model
- Confidence intervals
- Reason attribution

### 6. Continuous Learning
- User feedback loop
- Outcome-based recalibration
- Model drift detection

---

## 10. User Interface Modules

### Content Library
- Grid + timeline views
- Score-based sorting
- Fatigue warnings
- Authenticity breakdown panel

### Creator Profiles
- Lifetime ACCS averages
- Promotion density timeline
- Audience trust heatmaps
- Top-performing creative styles

### Campaign Dashboard
- Top predicted performers
- Budget allocation guidance
- Content comparison matrix
- Historical outcome validation

### Intelligence Views
- “Why this will convert” explanation
- Creative risk warnings
- Recommended ad shortlists

---

## 11. Competitive Moat

This platform provides:

- Predictive insight, not storage
- Quality ranking, not quantity
- Performance forecasting, not reporting
- Creator intelligence, not creator listings

Archive manages content.

This system guides revenue decisions.

---

## 12. Expansion Paths

- Auto-generated creator briefs based on high-conversion patterns
- AI creative improvement suggestions
- Automated ad-ready video trimming
- Cross-brand fatigue monitoring network
- Category-level performance benchmarks

---

## 13. Positioning Statement

> “Archive shows you what creators posted.  
> We show you what will make money.”

---

END OF SPEC
