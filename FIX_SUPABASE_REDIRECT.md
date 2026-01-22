# Fix Supabase Email Confirmation Redirect

## The Problem
Supabase confirmation emails redirect to `localhost:3000` instead of your production URL.

## The Solution

### Step 1: Update Site URL in Supabase
1. Go to **Supabase Dashboard** → Your Project
2. Go to **Settings** → **Authentication**
3. Scroll down to **URL Configuration**
4. Update **Site URL** to: `https://ghost-livid.vercel.app` (or your actual Vercel URL)
5. Click **Save**

### Step 2: Add Redirect URLs
In the same **URL Configuration** section:

1. **Redirect URLs** - Add these URLs (one per line):
   ```
   https://ghost-livid.vercel.app/**
   https://ghost-livid.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

2. The `**` wildcard allows any path under that domain
3. Include both production and localhost for development

### Step 3: Create Auth Callback Route
We need to create a callback route to handle the email confirmation:

Create `app/auth/callback/route.ts` to handle the redirect.

### Step 4: Test
1. Try signing up again
2. Check the confirmation email
3. Click the link - should redirect to your production URL

## Why This Happens
- Supabase uses the **Site URL** from settings for email links
- By default, it's set to `http://localhost:3000`
- You need to update it to your production URL

