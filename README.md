# Creator Intelligence & UGC Performance Platform

> "Not all UGC converts. We tell you which content actually will — before you spend money."

## Overview

An end-to-end creator intelligence platform that:

- Ingests and organizes creator-generated content
- Detects brand-relevant content beyond tags
- Analyzes authenticity, audience trust, promotional saturation, and fatigue
- Predicts which content will perform best in paid ads and on-site placement
- Guides brands toward higher ROAS decisions

## Core Differentiator: ACCS (Authenticity & Conversion Confidence Score)

Every content item receives a **0–100 predictive score** estimating its likelihood to drive real commercial outcomes.

### ACCS Dimensions

1. **Authenticity Intelligence** - Detects genuine vs scripted content
2. **Audience Trust Signals** - Measures engagement quality and purchase intent
3. **Promotion Saturation Index** - Tracks creator ad fatigue
4. **UGC Fatigue Detection** - Identifies creative exhaustion patterns
5. **Historical Outcome Learning** - Continuously improves from performance data

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers, Prisma ORM
- **Database**: PostgreSQL (Neon / Supabase recommended)
- **Caching**: Upstash Redis
- **Background Jobs**: Inngest
- **Media Storage**: Cloudflare R2 or S3
- **AI/ML**: OpenAI (embeddings), Whisper (transcription), OCR

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ghost
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add:
```
DATABASE_URL="postgresql://user:password@localhost:5432/creator_intelligence"
UPSTASH_REDIS_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
OPENAI_API_KEY="your-openai-key"
INNGEST_EVENT_KEY="your-inngest-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── content/       # Content management endpoints
│   │   └── inngest/       # Inngest webhook
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI primitives
│   ├── accs-score-card.tsx
│   └── content-library.tsx
├── lib/                   # Core libraries
│   ├── scoring/          # ACCS scoring system
│   │   ├── accs.ts       # Main scoring function
│   │   ├── authenticity.ts
│   │   ├── audience-trust.ts
│   │   ├── promotion-saturation.ts
│   │   └── fatigue.ts
│   ├── ingestion/        # Content ingestion
│   │   └── platform-adapters.ts
│   ├── detection/        # Brand detection
│   │   └── brand-detection.ts
│   ├── processing/       # Media processing
│   │   └── media.ts
│   ├── inngest/          # Background jobs
│   │   ├── client.ts
│   │   └── functions.ts
│   ├── prisma.ts         # Prisma client
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utilities
└── prisma/               # Database schema
    └── schema.prisma
```

## Key Features

### Content Ingestion
- Multi-platform support (Instagram, TikTok, YouTube)
- Automated content detection
- Deduplication and identity resolution

### Brand Detection
- Untagged content discovery
- Caption, transcript, and OCR analysis
- Visual similarity detection
- Behavior pattern tracking

### ACCS Scoring
- Real-time score calculation
- Explainable reasoning
- Historical score tracking
- Performance prediction

### Content Library
- Grid and timeline views
- Score-based filtering
- Detailed analytics
- Campaign assignment

## API Endpoints

### Content Management

- `POST /api/content/ingest` - Ingest content from platform
- `GET /api/content` - List content items (with filtering)
- `GET /api/content/[id]` - Get content item details

### Background Processing

Content processing is handled automatically via Inngest when content is ingested:
- Transcription
- OCR extraction
- Brand detection
- ACCS scoring

## Database Schema

The platform uses a comprehensive Prisma schema with models for:

- Organizations & Users
- Creators & Identity Resolution
- Campaigns & Assignments
- Content Items & Metrics
- Brand Dictionaries & Detections
- ACCS Scores (all dimensions)
- Integrations & Performance Data

See `prisma/schema.prisma` for full schema.

## Development

### Running Migrations

```bash
npx prisma migrate dev
```

### Generating Prisma Client

```bash
npx prisma generate
```

### Viewing Database

```bash
npx prisma studio
```

## Production Deployment

1. Set up production database (Neon, Supabase, etc.)
2. Configure environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Deploy to Vercel, Railway, or your preferred platform
5. Set up Inngest for background processing
6. Configure media storage (R2 or S3)

## Roadmap

- [ ] Platform API integrations (Instagram, TikTok, YouTube)
- [ ] Whisper transcription service
- [ ] OCR service integration
- [ ] Visual similarity search with embeddings
- [ ] Shopify/Meta Ads/TikTok Ads integrations
- [ ] Creator CRM interface
- [ ] Campaign management UI
- [ ] Advanced analytics dashboard
- [ ] Auto-generated creator briefs
- [ ] AI creative improvement suggestions

## License

[Your License Here]
