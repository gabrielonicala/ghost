# Fix: Inngest Events Not Appearing

## The Problem
Events aren't appearing in Inngest because you need an **Event Key** to send events.

## The Solution

### Step 1: Create Event Key in Inngest
1. Go to Inngest dashboard → **Manage** → **Event Keys**
2. Click **"+ Create Event Key"**
3. Give it a name (e.g., "Production Event Key")
4. Copy the key (starts with `event-`)

### Step 2: Add to Vercel
1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `INNGEST_EVENT_KEY`
   - **Value**: (paste the event key you just created)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
3. Click **Save**

### Step 3: Redeploy
- Vercel should auto-redeploy, or manually trigger a redeploy

### Step 4: Test
1. Go to your app: `https://ghost-livid.vercel.app`
2. Click "Add Test Content"
3. Check Inngest dashboard → **Monitor** → **Events**
4. You should now see `content/process` events appearing!

## Why You Need Both Keys

- **Signing Key** (`INNGEST_SIGNING_KEY`): Allows Inngest to **call your functions** (receive)
- **Event Key** (`INNGEST_EVENT_KEY`): Allows your app to **send events** to Inngest (send)

You need both for full bidirectional communication!

## Test Endpoint

I've also created a test endpoint:
- Visit: `https://ghost-livid.vercel.app/api/test-inngest`
- This will show you if the Event Key is configured correctly



