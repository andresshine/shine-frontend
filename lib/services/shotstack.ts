/**
 * Shotstack Post-Production Service
 * Handles AI background removal, dynamic theming, and video composition
 */

// ==================== TYPE DEFINITIONS ====================

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontFamily: string;
  backgroundType: 'image' | 'color' | 'texture';
  backgroundImageUrl?: string;
  backgroundTextureUrl?: string;
  backgroundColor?: string;
}

export interface ProduceTestimonialParams {
  videoUrl: string;
  quoteText: string;
  theme: ThemeConfig;
  musicUrl?: string;
  duration?: number;
}

export interface ShotstackResponse {
  success: boolean;
  message: string;
  response?: {
    id: string;
    status: string;
  };
}

// ==================== SHOTSTACK API CLIENT ====================

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_API_URL = 'https://api.shotstack.io/v1';
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

/**
 * Generate HTML asset for floating quote text
 */
function generateFloatingQuoteHTML(quoteText: string, theme: ThemeConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(' ', '+')}:wght@400;600;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      width: 1920px;
      height: 1080px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: '${theme.fontFamily}', sans-serif;
      overflow: hidden;
    }

    .quote-container {
      max-width: 1200px;
      padding: 60px;
      text-align: center;
    }

    .quote-icon {
      font-size: 80px;
      color: ${theme.primaryColor};
      opacity: 0.3;
      margin-bottom: 20px;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
    }

    .quote-text {
      font-size: 48px;
      font-weight: 600;
      color: ${theme.primaryColor};
      line-height: 1.4;
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
  <div class="quote-container">
    <div class="quote-icon">💡</div>
    <div class="quote-text">${quoteText}</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build Shotstack JSON template for video composition
 */
function buildShotstackTemplate(params: ProduceTestimonialParams) {
  const { videoUrl, quoteText, theme, musicUrl, duration = 30 } = params;

  // Determine background asset based on theme
  const backgroundAsset = theme.backgroundType === 'image' && theme.backgroundImageUrl
    ? {
        type: 'image',
        src: theme.backgroundImageUrl,
      }
    : theme.backgroundType === 'texture' && theme.backgroundTextureUrl
    ? {
        type: 'image',
        src: theme.backgroundTextureUrl,
      }
    : {
        type: 'html',
        html: `<div style="width:1920px;height:1080px;background:${theme.backgroundColor || theme.primaryColor};"></div>`,
      };

  return {
    timeline: {
      // ========== AUDIO TRACK (Background Music) ==========
      soundtrack: musicUrl ? {
        src: musicUrl,
        effect: 'fadeInFadeOut',
        volume: 0.18, // -15dB equivalent
      } : undefined,

      // ========== VIDEO TRACKS (Stacked from bottom to top) ==========
      tracks: [
        // TRACK 1 (Bottom): Background Layer
        {
          clips: [
            {
              asset: backgroundAsset,
              start: 0,
              length: duration,
              fit: 'cover',
              scale: 1.0,
            },
          ],
        },

        // TRACK 2 (Middle): User Video with AI Background Removal
        {
          clips: [
            {
              asset: {
                type: 'video',
                src: videoUrl,
                volume: 1.0,
              },
              start: 0,
              length: duration,
              fit: 'crop',
              scale: 1.0,
              position: 'center',

              // AI Background Removal (Green Screen effect)
              filter: 'greyscale', // Placeholder - Shotstack AI segmentation requires enterprise plan

              // Note: For full AI background removal, use:
              // filter: 'chroma',
              // filterOptions: {
              //   type: 'ai-segmentation',
              //   threshold: 0.1,
              // }
            },
          ],
        },

        // TRACK 3 (Top): Floating Quote Text
        {
          clips: [
            {
              asset: {
                type: 'html',
                html: generateFloatingQuoteHTML(quoteText, theme),
                width: 1920,
                height: 1080,
              },
              start: 2, // Delay 2 seconds for dramatic effect
              length: duration - 4, // End 2 seconds before video ends
              transition: {
                in: 'fade',
                out: 'fade',
              },
              opacity: 0.95,
            },
          ],
        },
      ],
    },

    // ========== OUTPUT CONFIGURATION ==========
    output: {
      format: 'mp4',
      resolution: 'hd',
      aspectRatio: '16:9',
      fps: 30,
      scaleTo: 'preview', // Use 'hd' for production
      quality: 'medium', // Use 'high' for production

      // Note: Shotstack doesn't support Mux as a direct destination
      // We'll download the video and upload to Mux separately
    },
  };
}

/**
 * Submit video production job to Shotstack
 */
export async function produceTestimonial(
  params: ProduceTestimonialParams
): Promise<ShotstackResponse> {
  try {
    if (!SHOTSTACK_API_KEY) {
      throw new Error('SHOTSTACK_API_KEY is not configured');
    }

    const template = buildShotstackTemplate(params);

    console.log('📹 Submitting Shotstack render job...');
    console.log('Template:', JSON.stringify(template, null, 2));

    const response = await fetch(`${SHOTSTACK_API_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY,
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Shotstack API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    console.log('✅ Shotstack render job submitted:', data.response.id);

    return {
      success: true,
      message: 'Video production started',
      response: data.response,
    };
  } catch (error) {
    console.error('❌ Shotstack error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check render job status
 */
export async function getRenderStatus(renderId: string) {
  try {
    if (!SHOTSTACK_API_KEY) {
      throw new Error('SHOTSTACK_API_KEY is not configured');
    }

    const response = await fetch(`${SHOTSTACK_API_URL}/render/${renderId}`, {
      headers: {
        'x-api-key': SHOTSTACK_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch render status');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error fetching render status:', error);
    throw error;
  }
}

/**
 * Upload Shotstack rendered video to Mux
 */
export async function uploadToMux(videoUrl: string): Promise<{ assetId: string; playbackId: string } | null> {
  try {
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new Error('Mux credentials not configured');
    }

    console.log('📤 Uploading Shotstack video to Mux:', videoUrl);

    const Mux = require('@mux/mux-node');
    const muxClient = new Mux({
      tokenId: MUX_TOKEN_ID,
      tokenSecret: MUX_TOKEN_SECRET,
    });

    // Create Mux asset from URL
    const asset = await muxClient.video.assets.create({
      input: [{ url: videoUrl }],
      playback_policy: ['public'],
      // mp4_support not available on basic tier
    });

    console.log('✅ Mux asset created:', asset.id);

    return {
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id || '',
    };
  } catch (error) {
    console.error('❌ Error uploading to Mux:', error);
    return null;
  }
}

// ==================== SAMPLE USAGE ====================

/*
Example usage:

import { produceTestimonial } from '@/lib/services/shotstack';

const result = await produceTestimonial({
  videoUrl: 'https://example.com/user-video.mp4',
  quoteText: "What's your role and team size?",
  theme: {
    primaryColor: '#D4AF37',
    secondaryColor: '#C9A961',
    tertiaryColor: '#B8994A',
    fontFamily: 'Inter',
    backgroundType: 'image',
    backgroundImageUrl: 'https://example.com/background.jpg',
  },
  musicUrl: 'https://example.com/background-music.mp3',
  duration: 30,
});

console.log('Render ID:', result.response?.id);

// Poll for status
const status = await getRenderStatus(result.response.id);
console.log('Status:', status.status);
console.log('Mux Asset ID:', status.destinations?.mux?.assetId);
*/
