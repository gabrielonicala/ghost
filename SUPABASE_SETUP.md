# Supabase Setup Guide

## What You Need from Supabase

For this project, you need:

1. **DATABASE_URL** - PostgreSQL connection string (most important!)
2. **Project URL** - For Supabase client (optional, for future auth features)
3. **Publishable API Key** - For Supabase client (optional, for future auth features)
4. **Service Role Key** - For admin operations (optional, for future features)

---

## Step 1: Get Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. You'll see several connection strings - you need the **URI** one
4. It looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   OR
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

5. **Important:** Replace `[PASSWORD]` with your actual database password
   - This is the password you set when creating the project
   - If you forgot it, you can reset it in Settings → Database → Database password

6. **For Prisma/this project, use the "Direct connection" or "Session mode" URI**
   - The "Transaction" mode uses a pooler which might have issues with Prisma migrations
   - Look for the one that says "Direct connection" or "Session mode"

---

## Step 2: Update Your .env File

Add this to your local `.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Replace:
- `[YOUR-PASSWORD]` with your database password
- `[PROJECT-REF]` with your project reference (the part after `db.` and before `.supabase.co`)

---

## Step 3: Test the Connection

Run this to test if the connection works:

```bash
npm run db:migrate
```

This will:
1. Connect to your Supabase database
2. Create all the tables from your Prisma schema
3. Set up the database structure

---

## Step 4: Add to Vercel

After testing locally, add the same `DATABASE_URL` to Vercel:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Your Supabase connection string
   - **Environment:** Select all (Production, Preview, Development)
3. Click **Save**

---

## Optional: Supabase Client Setup (for future auth)

If you want to use Supabase auth later, you'll also need:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

But for now, you only need `DATABASE_URL` to get started!

---

## Troubleshooting

**Connection fails?**
- Make sure you're using the "Direct connection" URI (port 5432, not 6543)
- Check that your password is correct
- Make sure your Supabase project isn't paused (free tier pauses after inactivity)

**Migration fails?**
- Make sure you're using the direct connection string (not the pooler)
- Check that your password doesn't have special characters that need URL encoding
- Try resetting your database password in Supabase dashboard

