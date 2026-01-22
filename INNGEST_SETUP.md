# Inngest Setup Guide

## Step 1: Get Your Signing Key

1. In Inngest dashboard, go to **Settings** → **Keys** (or **Manage** → **Apps** → **Settings**)
2. Copy your **Signing Key** (starts with `signkey-`)

## Step 2: Add to Vercel Environment Variables

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `INNGEST_SIGNING_KEY`
   - **Value**: (paste your signing key)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
3. Click **Save**
4. **Redeploy** your app (or wait for next deployment)

## Step 3: Set Up App Sync URL

After deploying, you need to tell Inngest where your app is:

1. In Inngest dashboard, go to **Manage** → **Apps**
2. Click **Create App** or select your app
3. Set the **Sync URL** to: `https://your-app.vercel.app/api/inngest`
   - Replace `your-app` with your actual Vercel domain
4. Click **Save**

## Step 4: Test Connection

1. In Inngest dashboard, go to **Monitor** → **Runs**
2. Trigger a test by adding content via your app
3. You should see function runs appear in the dashboard

## Your Inngest Endpoint

Your app exposes Inngest at: `https://your-app.vercel.app/api/inngest`

This endpoint:
- Handles function registration (GET)
- Receives events (POST)
- Handles function invocations (PUT)

## Current Functions

- **`process-content-item`**: Processes content (OCR, transcription, ACCS scoring)

## Troubleshooting

### Functions not appearing?
- Check that `INNGEST_SIGNING_KEY` is set in Vercel
- Verify the Sync URL is correct in Inngest dashboard
- Check Vercel deployment logs for errors

### Events not triggering?
- Check that events are being sent: `await inngest.send({ name: "content/process", data: {...} })`
- Verify the function is registered in Inngest dashboard
- Check function logs in Inngest dashboard

