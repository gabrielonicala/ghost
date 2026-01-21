# Troubleshooting Database Connection Error

## Error: "Can't reach database server"

This usually means one of these issues:

### 1. Supabase Project is Paused (Most Common)

**Free tier Supabase projects pause after 1 week of inactivity.**

**Solution:**
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Find your project
3. If it shows "Paused" or "Inactive", click **"Restore"** or **"Resume"**
4. Wait 1-2 minutes for it to wake up
5. Try your app again

### 2. Check DATABASE_URL in Vercel

**Verify the connection string is correct:**

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Check that `DATABASE_URL` is set correctly
3. It should be: `postgresql://postgres:qqz203v49a1@db.tscxtqaleknkkptzgdlk.supabase.co:5432/postgres`
4. Make sure there are no extra spaces or quotes
5. Make sure it's enabled for the right environments (Production, Preview, Development)

### 3. Test Connection Locally

Test if your local connection still works:

```bash
# This should work if Supabase is active
npm run db:migrate
```

If this fails locally too, Supabase is definitely paused.

### 4. Connection String Format

Make sure your connection string uses:
- **Direct connection** (port 5432) - NOT the pooler (port 6543)
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 5. Check Supabase Dashboard

1. Go to Supabase → Settings → Database
2. Check if the project status shows "Active"
3. If paused, you'll see a "Resume" or "Restore" button

---

## Quick Fix Steps

1. **Wake up Supabase:**
   - Go to Supabase dashboard
   - Click "Resume" or "Restore" on your project
   - Wait 1-2 minutes

2. **Verify Vercel env var:**
   - Check DATABASE_URL is correct
   - Make sure no extra characters

3. **Redeploy Vercel:**
   - After waking Supabase, trigger a new deployment
   - Or just refresh your app (it will retry)

4. **Test again:**
   - Try adding test content
   - Should work now!

---

## Prevention

To prevent pausing:
- Use Supabase at least once per week
- Or upgrade to a paid plan (no auto-pause)
- Or set up a cron job to ping your database weekly

