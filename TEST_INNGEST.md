# Testing Inngest Connection

## Step 1: Add Test Content
1. Go to your app: https://ghost-livid.vercel.app
2. Click "Add Test Content" button
3. This should trigger an Inngest event

## Step 2: Check Inngest Dashboard

### Check Events First
1. Go to **Monitor** → **Events**
2. You should see a `content/process` event appear
3. If you see the event, Inngest is receiving events ✅

### Then Check Runs
1. Go to **Monitor** → **Runs**
2. After the event is received, a function run should appear
3. Click on the run to see execution details

## Troubleshooting

### No events appearing?
- Check Vercel deployment logs for errors
- Verify `INNGEST_SIGNING_KEY` is set in Vercel
- Check browser console for errors when clicking "Add Test Content"

### Events appear but no runs?
- Check the function is registered: **Manage** → **Functions**
- Verify the event name matches: `content/process`
- Check function logs in Inngest dashboard

### Need Event Key?
If events aren't being sent, you might need an Event Key:
1. In Inngest dashboard → **Settings** → **Keys**
2. Copy the **Event Key** (starts with `event-`)
3. Add to Vercel as `INNGEST_EVENT_KEY`
4. Redeploy



