# Testing Media Processing Features

## What's Been Implemented

✅ **OCR (Optical Character Recognition)** - Extracts text from images
✅ **Audio Transcription** - Transcribes speech from videos using OpenAI Whisper
✅ **Visual Embeddings** - Generates embeddings for similarity search
✅ **Frame Extraction** - Extracts frames from videos for OCR
✅ **Perceptual Hashing** - Detects duplicate content
✅ **Color Extraction** - Extracts dominant colors from images

## How to Test

### Option 1: Test with Real Image URLs (OCR)

1. **Add test content with a real image URL:**
   - Go to your app: `https://ghost-livid.vercel.app`
   - Open browser console (F12)
   - Run this:
   ```javascript
   fetch('/api/content/test', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       platform: 'instagram',
       username: 'test_creator',
       caption: 'Check out this product!',
       mediaUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800', // Real image with text
       contentType: 'image'
     })
   }).then(r => r.json()).then(console.log)
   ```

2. **Check Inngest Dashboard:**
   - Go to Inngest Dashboard → Monitor → Runs
   - Find the run for your content
   - Check the steps:
     - `extract-ocr` - Should show OCR text extracted
     - `extract-visual-features` - Should show embeddings generated

3. **Check Database:**
   - The OCR text should be stored in `ContentOcrFrame` table
   - Visual features should be in `ContentVisualFeature` table

### Option 2: Test with Video URL (Transcription)

1. **Add test content with a video URL:**
   ```javascript
   fetch('/api/content/test', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       platform: 'youtube',
       username: 'test_creator',
       caption: 'Video content',
       mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // YouTube video
       contentType: 'video'
     })
   }).then(r => r.json()).then(console.log)
   ```

2. **Check for transcription:**
   - Inngest run should have `transcribe-audio` step
   - Transcript should be stored in `ContentTranscript` table

### Option 3: Use Test Endpoint with Real URLs

I'll create a better test endpoint that accepts real URLs.

## What to Look For

### In Inngest Dashboard:
- **Runs** → Click on a run → See steps:
  - ✅ `extract-ocr` - OCR text extracted
  - ✅ `transcribe-audio` - Audio transcribed (if video)
  - ✅ `extract-visual-features` - Embeddings generated
  - ✅ `detect-brands` - Brand detection ran
  - ✅ `calculate-accs` - ACCS score calculated

### In Your App:
- Content Library should show content
- Click on content → Should see ACCS score
- Score should be more accurate with real OCR/transcript data

### In Database (Supabase):
- `ContentOcrFrame` - OCR text from images
- `ContentTranscript` - Transcripts from videos
- `ContentVisualFeature` - Visual embeddings
- `ConversionConfidenceScore` - ACCS scores

## Expected Results

### OCR Test:
- Image with text → OCR extracts the text
- Text appears in `ContentOcrFrame` table
- Brand detection uses OCR text

### Transcription Test:
- Video with speech → Transcript extracted
- Transcript appears in `ContentTranscript` table
- ACCS scoring uses transcript for authenticity analysis

### Visual Features Test:
- Image → Embedding vector generated (1536 dimensions)
- Perceptual hash calculated
- Dominant colors extracted
- All stored in `ContentVisualFeature` table

## Troubleshooting

### No OCR text?
- Check if image URL is accessible
- Check Inngest run logs for errors
- Verify Tesseract.js is working (might need to download language data)

### No transcription?
- Check if video URL is accessible
- Verify OpenAI API key is set
- Check OpenAI API usage/quota

### No visual features?
- Check if image URL is accessible
- Verify OpenAI API key is set
- Check Inngest run logs

## Quick Test URLs

### Images with Text (for OCR):
- `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800`
- Any image with visible text

### Videos (for Transcription):
- YouTube videos (will extract thumbnail for OCR, but transcription needs actual video file)
- Note: For full transcription, you need a direct video file URL, not YouTube link

