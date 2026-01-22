# Why Vercel Can't Connect But Local Can

## Common Reasons

### 1. Environment Variable Not Set in Vercel
- Your local `.env` has `DATABASE_URL`
- But Vercel might not have it, or it's set incorrectly

### 2. Wrong Environment Selected
- Vercel has 3 environments: Production, Preview, Development
- The variable might only be set for one, but your deployment uses another

### 3. Connection String Format Difference
- Local might work with one format
- Vercel might need the connection string formatted differently
- Special characters in password might need URL encoding

### 4. Network/Firewall
- Supabase might have IP restrictions (unlikely for free tier)
- Vercel's IP ranges might be blocked

---

## How to Debug

### Step 1: Verify Vercel Has the Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Look for `DATABASE_URL`
3. Check:
   - ✅ Does it exist?
   - ✅ Is the value correct?
   - ✅ Are all 3 environments checked? (Production, Preview, Development)

### Step 2: Check the Exact Value

The value in Vercel should be EXACTLY:
```
postgresql://postgres:qqz203v49a1@db.tscxtqaleknkkptzgdlk.supabase.co:5432/postgres
```

Common mistakes:
- ❌ Extra spaces
- ❌ Wrapped in quotes (Vercel adds these automatically, don't add them)
- ❌ Wrong password
- ❌ Using pooler URL instead of direct connection

### Step 3: Check Deployment Environment

1. Go to Vercel → Deployments
2. Click on the latest deployment
3. Check which environment it used (Production/Preview)
4. Make sure `DATABASE_URL` is enabled for that environment

### Step 4: Test with Vercel CLI

You can test if Vercel can see the variable:

```bash
npm i -g vercel
vercel login
vercel env pull .env.local
cat .env.local
```

This downloads Vercel's environment variables locally so you can see what it's using.

### Step 5: Check Build Logs

1. Go to Vercel → Deployments → Latest deployment
2. Click "Build Logs"
3. Look for any errors about `DATABASE_URL` or database connection
4. Check if the variable is being loaded

---

## Quick Fix Checklist

- [ ] `DATABASE_URL` exists in Vercel environment variables
- [ ] Value matches your local `.env` exactly (no quotes, no spaces)
- [ ] All 3 environments are checked (Production, Preview, Development)
- [ ] Latest deployment completed successfully
- [ ] Supabase project is active (not paused)

---

## Most Likely Issue

**The DATABASE_URL is either:**
1. Not set in Vercel at all
2. Set but only for one environment (not the one your deployment uses)
3. Has a typo or formatting issue


