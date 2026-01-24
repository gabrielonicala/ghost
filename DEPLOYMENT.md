# Deployment Guide: Vercel + Database

## Neon vs Supabase Comparison

### Supabase (Recommended for this project)
✅ **Pros:**
- **Built-in Auth** - Full authentication system (email, OAuth, etc.)
- **PostgreSQL** - Full PostgreSQL database
- **Real-time** - Real-time subscriptions built-in
- **Storage** - File storage included
- **Dashboard** - Great admin UI
- **Free tier** - Generous free tier
- **Row Level Security** - Built-in security policies

❌ **Cons:**
- Slightly more opinionated
- Can be overkill if you only need a database

**Best for:** Projects that need auth + database + storage

### Neon
✅ **Pros:**
- **Pure PostgreSQL** - No vendor lock-in
- **Serverless** - Auto-scaling
- **Branching** - Database branching like git
- **Fast** - Great performance
- **Simple** - Just PostgreSQL, nothing else

❌ **Cons:**
- No built-in auth (you'd need to add Auth.js/NextAuth separately)
- No storage (need separate service)

**Best for:** Projects that just need a database

---

## Recommendation: Supabase

For this Creator Intelligence Platform, **Supabase is the better choice** because:
1. You'll likely need user authentication later
2. Built-in storage for media files
3. Real-time features could be useful for live updates
4. Easier to get started

---

## Setup Steps

### 1. Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: Creator Intelligence Platform"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your repository
5. Vercel will auto-detect Next.js settings

### 3. Set Up Supabase Database

1. Go to https://supabase.com
2. Sign up / Sign in
3. Click "New Project"
4. Fill in:
   - Name: `creator-intelligence` (or your choice)
   - Database Password: **Save this!**
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

### 4. Get Database Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Copy the **URI** connection string
4. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

### 5. Add Environment Variables in Vercel

1. In Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add these variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
OPENAI_API_KEY=your-openai-key
```

3. For each variable, select **Production**, **Preview**, and **Development**

### 6. Run Database Migrations

After deployment, you need to run migrations. You can:

**Option A: Run locally pointing to Supabase**
```bash
# Update your local .env with Supabase DATABASE_URL
npm run db:migrate
```

**Option B: Use Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npm run db:migrate
```

**Option C: Use Supabase SQL Editor**
- Copy the SQL from `prisma/migrations` folder
- Paste into Supabase SQL Editor and run

### 7. Generate Prisma Client in Vercel

Add a build script to ensure Prisma client is generated:

In `package.json`, update the build script:
```json
"scripts": {
  "build": "prisma generate && next build",
  ...
}
```

Or add a `postinstall` script:
```json
"scripts": {
  "postinstall": "prisma generate",
  ...
}
```

---

## Optional: Set Up Supabase Auth

If you want to use Supabase auth later:

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable email/password or OAuth providers
3. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```
4. Create auth utilities (we can add this later)

---

## Quick Checklist

- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Create Supabase project
- [ ] Copy DATABASE_URL from Supabase
- [ ] Add environment variables in Vercel
- [ ] Run database migrations
- [ ] Test the deployed app

---

## Troubleshooting

**Migration fails?**
- Make sure DATABASE_URL is correct
- Check that password is URL-encoded if it has special characters
- Verify database is accessible (not paused)

**Prisma client errors?**
- Make sure `prisma generate` runs in build
- Check that DATABASE_URL is set in Vercel

**Connection issues?**
- Supabase projects can pause after inactivity (free tier)
- Wake it up in the Supabase dashboard




