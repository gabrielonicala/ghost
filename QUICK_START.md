# Quick Start: Deploy to Vercel + Supabase

## Step 1: Push to GitHub

```bash
# Create a new repository on GitHub (github.com/new)
# Then run:

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository
5. Vercel auto-detects Next.js ✅
6. Click **"Deploy"** (don't add env vars yet)

## Step 3: Create Supabase Database

1. Go to https://supabase.com
2. Sign up / Sign in
3. Click **"New Project"**
4. Fill in:
   - **Name:** `creator-intelligence` (or your choice)
   - **Database Password:** ⚠️ **SAVE THIS PASSWORD!**
   - **Region:** Choose closest to you
5. Wait ~2 minutes for setup

## Step 4: Get Database Connection String

1. In Supabase dashboard → **Settings** → **Database**
2. Scroll to **Connection string** section
3. Copy the **URI** (not the other connection strings)
4. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

## Step 5: Add Environment Variables in Vercel

1. In Vercel project → **Settings** → **Environment Variables**
2. Add these (select **Production**, **Preview**, and **Development** for each):

   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   OPENAI_API_KEY=your-openai-key-here
   ```

3. Replace `[PASSWORD]` with your actual Supabase password
4. Replace `your-project.vercel.app` with your actual Vercel URL

## Step 6: Run Database Migrations

After adding env vars, run migrations:

**Option A: Local (easiest)**
```bash
# Update your local .env with Supabase DATABASE_URL
# Then run:
npm run db:migrate
```

**Option B: Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npm run db:migrate
```

## Step 7: Redeploy

1. In Vercel, go to **Deployments**
2. Click the **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

## Step 8: Test

Visit your Vercel URL and you should see the Content Library!

---

## Why Supabase?

✅ **Built-in Auth** - Ready for user authentication  
✅ **PostgreSQL** - Full-featured database  
✅ **Storage** - For media files  
✅ **Real-time** - Live updates  
✅ **Free tier** - Generous limits  

Perfect for this platform! 🚀


