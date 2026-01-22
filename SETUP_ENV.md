# Environment Variables Setup Guide

## Required for Basic Functionality

### 1. DATABASE_URL (REQUIRED)
**What it is:** PostgreSQL database connection string

**How to get it:**
- **Local PostgreSQL:** `postgresql://username:password@localhost:5432/creator_intelligence`
- **Neon (Free tier):** Sign up at https://neon.tech, create a project, copy the connection string
- **Supabase (Free tier):** Sign up at https://supabase.com, create a project, go to Settings > Database, copy the connection string
- **Railway:** Create a PostgreSQL service, copy the DATABASE_URL from the service variables

**Example:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/creator_intelligence"
```

### 2. NEXT_PUBLIC_APP_URL (REQUIRED for development)
**What it is:** Your app's base URL

**For local development:**
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**For production:** Your deployed URL (e.g., `https://yourdomain.com`)

---

## Optional (Can add later)

### 3. OpenAI API Key (Optional - for embeddings/advanced features)
**What it is:** API key for OpenAI services (for future visual embeddings, etc.)

**How to get it:**
1. Sign up at https://platform.openai.com
2. Go to API Keys section
3. Create a new secret key
4. Copy the key

**Example:**
```
OPENAI_API_KEY="sk-..."
```

**Note:** Not required for basic functionality, but needed for advanced features like visual similarity search.

---

### 4. Upstash Redis (Optional - for caching/rate limiting)
**What it is:** Redis instance for caching and rate limiting

**How to get it:**
1. Sign up at https://upstash.com (free tier available)
2. Create a Redis database
3. Copy the REST URL and REST Token

**Example:**
```
UPSTASH_REDIS_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

**Note:** Can skip for now if you're just getting started.

---

### 5. Inngest (Optional - for background jobs)
**What it is:** Background job processing service

**How to get it:**
1. Sign up at https://inngest.com
2. Create an app
3. Get your Event Key and Signing Key from the dashboard

**Example:**
```
INNGEST_EVENT_KEY="your-event-key"
INNGEST_SIGNING_KEY="your-signing-key"
```

**Note:** Can skip for now - background processing will be disabled but the app will still work.

---

### 6. AWS S3 or Cloudflare R2 (Optional - for media storage)
**What it is:** Object storage for media files (videos, images)

**AWS S3:**
1. Create an AWS account
2. Create an S3 bucket
3. Create an IAM user with S3 permissions
4. Get Access Key ID and Secret Access Key

**Example:**
```
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

**OR Cloudflare R2 (Free tier):**
1. Sign up at https://cloudflare.com
2. Go to R2 in dashboard
3. Create a bucket
4. Create API token

**Example:**
```
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"
```

**Note:** Can skip for now - media storage features won't work but core functionality will.

---

## Minimum Setup to Get Started

For the **absolute minimum** to run the app locally, you only need:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/creator_intelligence"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Everything else can be added later as you need those features.

---

## Quick Start Steps

1. **Create `.env` file** in the project root
2. **Add DATABASE_URL** (get from Neon, Supabase, or set up local PostgreSQL)
3. **Add NEXT_PUBLIC_APP_URL** (use `http://localhost:3000` for local dev)
4. **Run migrations:** `npm run db:migrate`
5. **Generate Prisma client:** `npm run db:generate`
6. **Start dev server:** `npm run dev`


