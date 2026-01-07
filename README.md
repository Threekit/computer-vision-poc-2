# Computer Vision POC - Door & Window Detection

A proof-of-concept application that uses Google Cloud Vision API to detect and highlight doors and windows in uploaded images. Built with React, Hono, and deployed on Cloudflare Workers.

## Features

- **Image Upload**: Simple drag-and-drop interface for uploading door/window images
- **Object Detection**: Leverages Google Cloud Vision API's Object Localization feature
- **Visual Feedback**: Displays detected objects with color-coded bounding boxes and confidence scores
- **Label Detection**: Shows semantic labels describing the image content

## Architecture

```
User → React Frontend → Cloudflare Worker → Google Cloud Vision API
                ↓
          Canvas Overlay with Bounding Boxes
```

- **Frontend**: React with TypeScript, Canvas API for visualization
- **Backend**: Hono framework on Cloudflare Workers
- **AI Service**: Google Cloud Vision API (Object Localization + Label Detection)

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Google Cloud Account** with billing enabled
3. **Cloudflare Account** (for deployment)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Cloud Vision API

#### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

#### Enable Cloud Vision API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Cloud Vision API"
3. Click **Enable**

#### Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., "vision-api-worker")
4. Click **Create and Continue**
5. Grant the role: **Cloud Vision API User**
6. Click **Done**

#### Download Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Download the key file (keep it secure!)

### 3. Configure Cloudflare Worker Secrets

The Google Cloud credentials need to be stored as a secret in Cloudflare Workers:

```bash
# For local development (creates .dev.vars file)
npx wrangler secret put GOOGLE_CREDENTIALS --env dev

# For production deployment
npx wrangler secret put GOOGLE_CREDENTIALS
```

When prompted, paste the **entire contents** of your service account JSON key file.

Alternatively, for local development, you can create a `.dev.vars` file:

```
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
```

⚠️ **Never commit the `.dev.vars` file or the service account JSON to version control!**

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Deploy to Cloudflare

```bash
npm run deploy
```

## Usage

1. **Upload an Image**: Click "Choose Image" and select a photo of doors/windows
2. **Analyze**: Click "Analyze Image" to send it to the Vision API
3. **View Results**: 
   - See the original image on the left
   - View the annotated image with bounding boxes on the right
   - Color coding: Blue = Doors, Green = Windows, Gray = Other objects
   - Check detected objects and confidence scores below

## API Endpoints

### `POST /api/vision/analyze`

Analyzes an uploaded image for objects and labels.

**Request**: `multipart/form-data`
- `image`: Image file (JPEG, PNG, etc.)

**Response**: JSON
```json
{
  "objects": [
    {
      "name": "Door",
      "confidence": 0.92,
      "boundingPoly": {
        "normalizedVertices": [
          { "x": 0.1, "y": 0.2 },
          { "x": 0.3, "y": 0.2 },
          { "x": 0.3, "y": 0.8 },
          { "x": 0.1, "y": 0.8 }
        ]
      }
    }
  ],
  "labels": [
    { "description": "Door", "confidence": 0.95 },
    { "description": "Building", "confidence": 0.89 }
  ]
}
```

## Project Structure

```
src/
├── react-app/          # React frontend
│   ├── App.tsx         # Main component with upload UI and canvas
│   ├── App.css         # Styling
│   └── services/
│       └── api.ts      # API client for Vision endpoint
└── worker/             # Cloudflare Worker backend
    ├── index.ts        # Main worker entry point
    └── vision.ts       # Google Vision API integration
```

## Notes

- **Object Detection Limitations**: Google Vision API's Object Localization may not always specifically identify "doors" and "windows." It detects common objects and may label them as "Door," "Window," "Furniture," etc.
- **Custom Models**: For more accurate door/window detection, consider training a custom model with Vertex AI Vision
- **Image Size**: Large images may take longer to process
- **Costs**: Google Cloud Vision API charges per image analyzed. See [pricing](https://cloud.google.com/vision/pricing)

## Troubleshooting

### "Google credentials not configured" error

Make sure you've set the `GOOGLE_CREDENTIALS` secret using `wrangler secret put GOOGLE_CREDENTIALS`

### "Failed to analyze image" error

- Check that the Cloud Vision API is enabled in your Google Cloud project
- Verify the service account has the correct permissions
- Ensure the credentials JSON is valid

### Canvas not showing bounding boxes

- Check browser console for errors
- Verify the API response contains objects with `boundingPoly` data
- Ensure the image has fully loaded before analysis results are rendered

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run preview` - Build and preview locally
- `npm run cf-typegen` - Generate Cloudflare Worker types

## Security Best Practices

- Never commit `.dev.vars` or service account JSON files
- Use Cloudflare Workers secrets for production credentials
- Implement rate limiting for the API endpoint in production
- Add authentication/authorization if deploying publicly

## License

This is a proof-of-concept project for demonstration purposes.
