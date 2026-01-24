# Try Connection Pooler Instead

Since your project is active but Vercel can't connect, let's try using Supabase's **Connection Pooler** instead of direct connection.

## Why Pooler?

- **Better for serverless** (Vercel functions are serverless)
- **More reliable** connections
- **Handles connection limits** better
- **Optimized for serverless environments**

## Steps:

### 1. Get Pooler Connection String

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection pooling** section
3. Find **Session mode** (not Transaction mode)
4. Copy the connection string
5. It will look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   Note: Uses port **6543** (not 5432)

### 2. Update Vercel

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Click **Edit**
4. Replace the value with the **pooler connection string** (Session mode)
5. Make sure all environments are checked
6. Click **Save**

### 3. Redeploy

- Vercel will auto-redeploy, or
- Manually trigger a redeploy

### 4. Test

Visit: `https://your-app.vercel.app/api/test-db`

Should work now!

---

## If Pooler Doesn't Work

Try these:

1. **Check connection string format:**
   - Make sure no extra spaces
   - Make sure password is correct
   - Make sure using Session mode (not Transaction)

2. **Try Transaction mode:**
   - Sometimes Transaction mode works better
   - But Session mode is usually preferred

3. **Check Supabase logs:**
   - Supabase Dashboard → Logs
   - See if there are connection errors

4. **Verify project is actually active:**
   - Sometimes dashboard shows active but database isn't ready
   - Try a simple query in Supabase SQL Editor




