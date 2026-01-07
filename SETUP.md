# Quick Setup Guide

Follow these steps to get the Computer Vision POC running locally.

## 1. Install Dependencies

```bash
npm install
```

✅ Already completed

## 2. Set Up Google Cloud Vision API

### Create Google Cloud Project & Enable API

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Library**
4. Search "Cloud Vision API" and click **Enable**

### Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `vision-api-worker`
4. Click **Create and Continue**
5. Role: Select **Cloud Vision API User**
6. Click **Done**

### Download Credentials

1. Click the service account you created
2. Go to **Keys** tab
3. **Add Key** → **Create new key** → **JSON**
4. Save the downloaded JSON file somewhere safe

## 3. Configure Local Development

Create a `.dev.vars` file in the project root:

```bash
echo 'GOOGLE_CREDENTIALS=PASTE_YOUR_JSON_HERE' > .dev.vars
```

Replace `PASTE_YOUR_JSON_HERE` with the entire contents of your downloaded JSON file (it should be a single line).

Example:
```
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123",...}
```

⚠️ **Important**: The `.dev.vars` file is already in `.gitignore` - never commit it!

## 3b. Configure Nano Banana (Gemini Image Generation) - Optional

Nano Banana is Google's image generation feature that can create composite images by combining user-uploaded photos with product images.

### Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the generated API key

### Add to Local Development

Add the API key to your `.dev.vars` file:

```bash
GEMINI_API_KEY=your_api_key_here
```

Your `.dev.vars` file should now look like this:

```
GOOGLE_CREDENTIALS={"type":"service_account",...}
GEMINI_API_KEY=AIza...your_key_here
```

### API Usage Example

```typescript
import { api } from './services/api';

// Generate a composite image
const userImage = document.querySelector('input[type="file"]').files[0];
const productImage = await fetch('/product.jpg').then(r => r.blob());
const prompt = "Place this product naturally in the uploaded room scene";

const result = await api.generateImage(
  userImage,
  [productImage],
  prompt
);

// Display the generated image
const img = document.createElement('img');
img.src = `data:${result.mimeType};base64,${result.generatedImage}`;
document.body.appendChild(img);
```

### Nano Banana Models

- **gemini-2.5-flash-image** (default): Fast, efficient image generation
- **gemini-3-pro-image-preview**: Higher quality with advanced reasoning

The implementation uses the Flash model for speed. To upgrade to Pro, edit `src/worker/nano-banana.ts` and change the model name.

### Pricing

Gemini API pricing (as of January 2025):
- Free tier: 15 requests per minute, 1,500 requests per day
- See [Gemini API Pricing](https://ai.google.dev/pricing) for details

### Resources

- [Nano Banana Documentation](https://ai.google.dev/gemini-api/docs/nanobanana)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 5. Test the Application

1. Click **Choose Image** and select a photo with doors/windows
2. Click **Analyze Image**
3. View the detected objects with bounding boxes

## Troubleshooting

### "Google credentials not configured" error

- Make sure `.dev.vars` exists in the project root
- Verify the JSON is valid (no extra quotes or newlines)
- Restart the dev server after creating `.dev.vars`

### No objects detected

- Google Vision API may not always detect doors/windows specifically
- Try different images with clearer views of architectural elements
- Check the "Image Labels" section to see what the API recognized

### Build errors

- Run `npm install` again to ensure all dependencies are installed
- Make sure Node.js version is 18 or higher: `node --version`

## Next Steps

### Deploy to Cloudflare

1. Update `wrangler.toml` - change the `name` and `routes` section
2. Set production secrets:
   ```bash
   # Google Cloud Vision API credentials
   npx wrangler secret put GOOGLE_CREDENTIALS
   ```
   Paste the JSON content when prompted
   
   ```bash
   # Gemini API key (if using Nano Banana)
   npx wrangler secret put GEMINI_API_KEY
   ```
   Paste your Gemini API key when prompted
   
3. Deploy:
   ```bash
   npm run deploy
   ```

### Improve Detection

Google's Object Localization works well for common objects but may not specifically identify "doors" and "windows" in all images. For better results:

- **Use Vertex AI**: Train a custom model specifically for door/window detection
- **Image Quality**: Use high-resolution images with good lighting
- **Clear Views**: Images should have doors/windows clearly visible from the front

## Cost Considerations

Google Cloud Vision API pricing (as of 2024):
- First 1,000 requests/month: Free
- After that: $1.50 per 1,000 images

Monitor usage in the [Google Cloud Console](https://console.cloud.google.com/billing).

