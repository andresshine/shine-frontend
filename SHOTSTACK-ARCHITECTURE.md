# Shotstack Post-Production Architecture

## 🎬 Overview

The Shine Post-Producer uses **Shotstack** for AI-powered video composition and **Mux** for video delivery. This system automatically:

1. Removes the user's background using AI segmentation
2. Replaces it with branded backgrounds (images, textures, or colors)
3. Adds floating quote overlays with custom fonts and animations
4. Mixes background music with professional audio levels
5. Outputs directly to Mux for CDN delivery

---

## 🏗️ Layer Architecture

### Video Composition Stack (Bottom → Top)

```
┌─────────────────────────────────────────────┐
│  TRACK 3: Floating Quote Text (HTML/CSS)   │ ← Top Layer
│  - Custom fonts from Google Fonts           │
│  - Animated fade-in effects                 │
│  - Drop shadows for depth                   │
│  - Delays 2s, ends 2s before video          │
├─────────────────────────────────────────────┤
│  TRACK 2: User Video (AI Background Removed)│ ← Middle Layer
│  - Original recording                       │
│  - AI segmentation filter applied           │
│  - Fit: crop, Position: center             │
│  - Full audio preserved                     │
├─────────────────────────────────────────────┤
│  TRACK 1: Dynamic Background               │ ← Bottom Layer
│  - Image URL (high-res brand asset)         │
│  - Texture URL (patterns, gradients)        │
│  - Solid Color (from theme palette)         │
│  - Fit: cover, Scale: 1.0                   │
└─────────────────────────────────────────────┘

🎵 SOUNDTRACK: Background Music (Global Audio)
   - Volume: -15dB (0.18 normalized)
   - Fade In/Out: 2 seconds
   - Full duration sync
```

---

## 🎨 Dynamic Theming with Merge Fields

### Theme Configuration

```typescript
interface ThemeConfig {
  primaryColor: string;        // e.g., "#D4AF37" (Gold)
  secondaryColor: string;       // e.g., "#C9A961"
  tertiaryColor: string;        // e.g., "#B8994A"
  fontFamily: string;           // e.g., "Inter", "Montserrat"
  backgroundType: 'image' | 'color' | 'texture';
  backgroundImageUrl?: string;  // High-res brand image
  backgroundTextureUrl?: string; // Pattern/gradient
  backgroundColor?: string;      // Fallback solid color
}
```

### Merge Fields Injection

Shotstack uses **merge fields** (`{{VARIABLE_NAME}}`) to inject dynamic values at render time:

```json
{
  "merge": [
    {
      "find": "MUX_TOKEN_ID",
      "replace": "actual-mux-token-from-env"
    },
    {
      "find": "MUX_TOKEN_SECRET",
      "replace": "actual-mux-secret-from-env"
    }
  ]
}
```

This allows secure credential injection without hardcoding secrets in templates.

---

## 🎯 AI Background Removal

### Current Implementation (Placeholder)

```json
{
  "filter": "greyscale"
}
```

### Production Implementation (Enterprise Plan Required)

```json
{
  "filter": "chroma",
  "filterOptions": {
    "type": "ai-segmentation",
    "threshold": 0.1
  }
}
```

**Note:** Shotstack's AI segmentation requires an Enterprise plan. For the standard plan, we use a placeholder filter. Alternative solutions:

- Use **remove.bg API** for pre-processing
- Use **Runway ML** for background removal
- Implement custom **TensorFlow.js** models client-side

---

## 🎵 Audio Mixing Strategy

### Background Music Configuration

```json
{
  "soundtrack": {
    "src": "https://example.com/background-music.mp3",
    "effect": "fadeInFadeOut",
    "volume": 0.18  // -15dB in normalized scale
  }
}
```

### Audio Levels

| Element | Volume | dB | Purpose |
|---------|--------|-----|---------|
| User Voice | 1.0 | 0dB | Clear speech (priority) |
| Background Music | 0.18 | -15dB | Ambient atmosphere |

### Fade Strategy

- **Fade In**: 2 seconds at start
- **Fade Out**: 2 seconds before end
- **Total Duration**: Matches video length exactly

---

## 📤 Mux Integration

### Automatic Upload Configuration

```json
{
  "destinations": [
    {
      "provider": "mux",
      "options": {
        "accessToken": "{{MUX_TOKEN_ID}}",
        "secretKey": "{{MUX_TOKEN_SECRET}}",
        "playbackPolicy": ["public"],
        "mp4Support": "standard"
      }
    }
  ]
}
```

### Workflow

1. Shotstack renders video → MP4 output
2. Shotstack automatically uploads to Mux
3. Mux processes and generates:
   - HLS streams (adaptive bitrate)
   - MP4 downloads
   - Thumbnail sprites
   - Playback ID
4. Return Mux Asset ID to Shine backend

---

## 🚀 API Usage

### Trigger Post-Production

```bash
POST /api/shotstack/produce
```

**Request Body:**

```json
{
  "videoUrl": "https://mux.com/video.mp4",
  "quoteText": "What's your role and team size?",
  "theme": {
    "primaryColor": "#D4AF37",
    "secondaryColor": "#C9A961",
    "tertiaryColor": "#B8994A",
    "fontFamily": "Inter",
    "backgroundType": "image",
    "backgroundImageUrl": "https://example.com/bg.jpg"
  },
  "musicUrl": "https://example.com/music.mp3",
  "duration": 30
}
```

**Response:**

```json
{
  "success": true,
  "renderId": "f5a9c8d2-1234-5678-abcd-ef0123456789",
  "status": "queued",
  "message": "Video production started successfully"
}
```

### Check Render Status

```bash
GET /api/shotstack/status/{renderId}
```

**Response:**

```json
{
  "success": true,
  "renderId": "f5a9c8d2-1234-5678-abcd-ef0123456789",
  "status": "done",
  "progress": 100,
  "url": "https://shotstack-output.s3.amazonaws.com/video.mp4",
  "muxAssetId": "abc123xyz"
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job submitted, waiting to start |
| `fetching` | Downloading source assets |
| `rendering` | Compositing video layers |
| `saving` | Uploading to Mux |
| `done` | Complete, Mux asset ready |
| `failed` | Error occurred |

---

## 💾 Environment Variables

Add to `.env.local`:

```bash
# Shotstack API
SHOTSTACK_API_KEY=your-shotstack-api-key

# Mux (Already configured)
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
```

Get your Shotstack API key from: https://dashboard.shotstack.io/

---

## 🎨 HTML Asset (Floating Quote)

### Features

- **Custom Fonts**: Google Fonts integration
- **Responsive Layout**: Flexbox centering
- **Animations**: CSS keyframes for fade-in-up effect
- **Typography**: Drop shadows for readability
- **Icon**: Emoji lightbulb for visual interest

### Sample HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      width: 1920px;
      height: 1080px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }

    .quote-text {
      font-size: 48px;
      font-weight: 600;
      color: #D4AF37;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      animation: fadeInUp 1s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</head>
<body>
  <div class="quote-text">What's your role and team size?</div>
</body>
</html>
```

---

## 🧪 Testing

### Test the Pipeline

```typescript
import { produceTestimonial } from '@/lib/services/shotstack';

const result = await produceTestimonial({
  videoUrl: 'https://example.com/user-video.mp4',
  quoteText: "What's your role and team size?",
  theme: {
    primaryColor: '#D4AF37',
    secondaryColor: '#C9A961',
    tertiaryColor: '#B8994A',
    fontFamily: 'Inter',
    backgroundType: 'color',
    backgroundColor: '#1a1a1a',
  },
  musicUrl: 'https://shotstack-assets.s3.amazonaws.com/music/unminus/ambisax.mp3',
  duration: 30,
});

console.log('Render ID:', result.response?.id);
```

---

## 📊 Performance & Costs

### Rendering Times

| Resolution | Duration | Avg. Render Time |
|------------|----------|------------------|
| Preview (540p) | 30s | ~2 minutes |
| HD (1080p) | 30s | ~5 minutes |
| HD (1080p) | 60s | ~10 minutes |

### Shotstack Pricing

- **Starter**: 20 minutes/month free
- **Developer**: $49/mo - 200 minutes
- **Production**: $199/mo - 1000 minutes
- **Enterprise**: Custom - Unlimited + AI features

---

## ✅ Next Steps

1. **Add to `.env.local`**: SHOTSTACK_API_KEY
2. **Test endpoint**: `POST /api/shotstack/produce`
3. **Integrate with recording flow**: Trigger post-production after upload
4. **Poll for completion**: Check status every 5 seconds
5. **Display result**: Show Mux video with branded overlay

---

## 🔗 Resources

- [Shotstack API Docs](https://shotstack.io/docs/api/)
- [Shotstack Templates](https://shotstack.io/templates/)
- [Mux Destination Guide](https://shotstack.io/docs/api/#destinations)
- [HTML Asset Examples](https://shotstack.io/docs/guide/html-assets/)

---

**Built with 💛 for Shine**
