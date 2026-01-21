# Add These Environment Variables to Vercel

## Required Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

### 1. Supabase URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://tscxtqaleknkkptzgdlk.supabase.co`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### 2. Supabase Publishable Key
- **Name:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **Value:** `sb_publishable_TeSJyDbbWQX-dS_YlxUL-A_MTMUOPCR`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### 3. Keep DATABASE_URL (for Prisma migrations)
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres:qqz203v49a1@db.tscxtqaleknkkptzgdlk.supabase.co:5432/postgres`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### 4. Other Variables
- `NEXT_PUBLIC_APP_URL` = Your Vercel URL
- `OPENAI_API_KEY` = Your OpenAI key

---

## After Adding Variables

1. **Save** all variables
2. **Redeploy** your project (or wait for auto-redeploy)
3. **Test:** Visit `https://your-app.vercel.app/api/test-db`

The test endpoint will now use Supabase client instead of direct Prisma connection.

