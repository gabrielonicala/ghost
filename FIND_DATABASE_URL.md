# How to Find Your Supabase Database Connection String

## Step-by-Step Guide

### Option 1: Settings → Database (Most Common)

1. In your Supabase dashboard, click **Settings** (gear icon in left sidebar)
2. Click **Database** in the settings menu
3. Scroll down to find **Connection string** or **Connection info** section
4. Look for tabs or options like:
   - **URI** 
   - **Connection string**
   - **Direct connection**
   - **Session mode**

5. You should see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Option 2: Connection Pooling Section

Sometimes it's under **Connection pooling**:

1. Settings → Database
2. Look for **Connection pooling** section
3. There might be a **Direct connection** tab
4. Copy the connection string from there

### Option 3: Project Settings → Database

1. Click on your project name/icon
2. Go to **Project Settings**
3. Click **Database**
4. Look for **Connection string** or **Database URL**

---

## What You're Looking For

The connection string should look like one of these:

**Format 1 (Direct connection):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Format 2 (Pooled connection):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**For Prisma, use Format 1 (direct connection on port 5432)**

---

## What You're NOT Looking For

❌ RESTful endpoint: `https://xxxxx.supabase.co` (this is the API URL)
❌ Publishable API key: `eyJhbGc...` (this is for Supabase client)
❌ Project URL: `https://xxxxx.supabase.co` (this is the API endpoint)

---

## If You Still Can't Find It

1. **Check if you need to set/reset your database password:**
   - Settings → Database → Database password
   - If you see "Reset database password", click it
   - This will show you the password and connection info

2. **Try the SQL Editor:**
   - Click **SQL Editor** in the left sidebar
   - Sometimes connection info is shown there

3. **Check the Connection Info card:**
   - In Settings → Database
   - Look for a card/section that shows:
     - Host
     - Port (should be 5432)
     - Database name (usually "postgres")
     - User (usually "postgres")
   - You can construct the connection string manually:
     ```
     postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
     ```

---

## Quick Test

Once you have it, you can test it by running:
```bash
npm run db:migrate
```

If it works, you'll see tables being created. If it fails, check:
- Password is correct
- Using port 5432 (not 6543)
- Using direct connection (not pooler)




