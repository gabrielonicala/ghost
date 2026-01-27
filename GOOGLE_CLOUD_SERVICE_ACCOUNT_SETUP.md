# Google Cloud Service Account Setup for Video Intelligence API

## ⚠️ Important: Service Account Authentication is REQUIRED

**The Video Intelligence API does NOT support API keys** - it requires service account authentication. The code has been updated to use service accounts.

## Step 1: Enable the Video Intelligence API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Library**
3. Search for "Video Intelligence API"
4. Click **Enable**

## Step 2: Create a Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., "video-intelligence-service")
4. Click **Create and Continue**

## Step 3: Grant Minimal Permissions

**DO NOT use "Owner" role** - it's a security risk!

### Option A: Use "Editor" Role (Easiest, Still Broad)
- Search for: `Editor`
- This gives read/write access to resources but not billing/admin access
- **Recommended for getting started quickly**
- ⚠️ **Note**: There is no pre-built "Cloud Video Intelligence API User" role. Use "Editor" or create a custom role.

### Option B: Create a Custom Role (Most Secure)
1. Go to **IAM & Admin** → **Roles**
2. Click **Create Role**
3. Name it: `Video Intelligence API User`
4. Add these permissions:
   - `videointelligence.operations.get`
   - `videointelligence.videos.annotate`
   - `videointelligence.videos.detectExplicitContent`
   - `videointelligence.videos.detectText`
5. Assign this custom role to your service account

### Option C: Use "Service Usage Consumer" (Minimal)
- Search for: `Service Usage Consumer`
- This allows the service account to use enabled APIs
- May need additional permissions depending on your setup

## Step 4: Create and Download Key

1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Choose **JSON**
5. Download the key file
6. **Never commit this file to git!**

## Step 5: Configure Credentials

### For Local Development

1. Save the JSON key file somewhere safe (e.g., `~/.gcloud/video-intelligence-key.json`)
2. Add to your `.env` file:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/key.json
   ```
   Or use the full path:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\Downloads\video-intelligence-key.json
   ```

### For Vercel (Production)

Since Vercel can't access local files, you need to base64-encode the JSON key:

1. **On Windows (PowerShell):**
   ```powershell
   $content = Get-Content -Path "path\to\your\key.json" -Raw
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
   ```

2. **On Mac/Linux:**
   ```bash
   cat key.json | base64
   ```

3. Copy the base64 output and add to Vercel:
   - Go to **Vercel** → Your Project → **Settings** → **Environment Variables**
   - Add:
     - **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
     - **Value**: (paste the base64 string)
     - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

4. **Redeploy** your app

## Step 6: Test

The code will automatically detect which credential method to use:
- `GOOGLE_APPLICATION_CREDENTIALS` (file path) for local
- `GOOGLE_SERVICE_ACCOUNT_KEY` (base64 JSON) for Vercel

Try processing a video and check the logs!

## Troubleshooting

### "Credentials not found" error
- Make sure `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_SERVICE_ACCOUNT_KEY` is set
- For local: Check the file path is correct
- For Vercel: Make sure the base64 string is valid (no line breaks)

### "Permission denied" error
- Make sure the Video Intelligence API is enabled
- Check that your service account has the correct role
- Try using "Editor" role first to test, then create a custom role

### "Operation not found" error
- This might be a timing issue - the code handles this automatically
- If it persists, check that the service account has `videointelligence.operations.get` permission

## Security Best Practices

- ✅ Use the **least privilege** principle (minimum permissions needed)
- ❌ **Never** use "Owner" role for service accounts
- ✅ Rotate keys/credentials regularly
- ✅ Store credentials in environment variables (never in code)
- ✅ Use different service accounts for different purposes
- ✅ Add the key file to `.gitignore` if storing locally

## What Changed in the Code

The `lib/processing/video-intelligence.ts` file now:
- Uses `@google-cloud/video-intelligence` client library
- Supports both file path and base64-encoded credentials
- Automatically handles authentication
- Works with both local development and Vercel deployment
