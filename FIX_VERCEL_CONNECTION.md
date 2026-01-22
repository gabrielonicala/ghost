# Fix: Vercel Can't Reach Supabase Database

## The Problem

Your debug endpoint shows:
- ✅ `hasDatabaseUrl: true` - Environment variable IS set
- ✅ `databaseHost: "db.tscxtqaleknkkptzgdlk.supabase.co"` - Correct host
- ❌ But still can't connect: "Can't reach database server"

## Most Likely Cause: Supabase Project is Paused

**Free tier Supabase projects automatically pause after 1 week of inactivity.**

### How to Check & Fix:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Find your project: `tscxtqaleknkkptzgdlk`

2. **Check Project Status:**
   - Does it show "Paused" or "Inactive"?
   - Is there a "Resume" or "Restore" button?

3. **If Paused:**
   - Click **"Resume"** or **"Restore"**
   - Wait 1-2 minutes for the database to wake up
   - Try your Vercel app again

---

## Alternative: Use Connection Pooler

If direct connection doesn't work, try using Supabase's connection pooler:

### Get Pooler Connection String:

1. Supabase Dashboard → Settings → Database
2. Scroll to **Connection pooling** section
3. Copy the **Session mode** connection string
4. It will look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

5. **Update Vercel:**
   - Go to Environment Variables
   - Update `DATABASE_URL` with the pooler connection string
   - Redeploy

**Note:** Pooler uses port **6543**, direct connection uses **5432**

---

## Other Possible Issues

### 1. IP Restrictions (Unlikely)
- Free tier usually doesn't have IP restrictions
- But check: Supabase → Settings → Database → Connection pooling
- Make sure "Allow connections from anywhere" is enabled

### 2. Connection String Format
- Make sure password doesn't have special characters that need URL encoding
- If password has `@`, `#`, `%`, etc., they need to be URL-encoded

### 3. Network Timeout
- Vercel might be timing out
- Try the pooler connection (it's more reliable)

---

## Quick Test

After resuming Supabase:

1. **Test locally:**
   ```bash
   npm run db:migrate
   ```
   Should work if Supabase is active

2. **Test on Vercel:**
   - Visit: `https://your-app.vercel.app/api/test-db`
   - Should show `"success": true`

---

## Prevention

To prevent auto-pause:
- Use your database at least once per week
- Or upgrade to paid plan (no auto-pause)
- Or set up a weekly cron job to ping the database


