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
 * Generate simple HTML asset for quote text overlay
 * Uses inline styles compatible with Shotstack's HTML renderer
 * Note: Shotstack doesn't support @import or external fonts
 */
function generateFloatingQuoteHTML(quoteText: string, theme: ThemeConfig): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1920px;
  height: 1080px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-family: Montserrat, Arial, Helvetica, sans-serif;
}
.quote {
  padding: 40px 60px;
  margin-bottom: 60px;
  text-align: center;
  max-width: 1400px;
}
.text {
  font-size: 52px;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.4;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4);
}
</style>
</head>
<body>
<div class="quote"><div class="text">${quoteText}</div></div>
</body>
</html>`;
}

/**
 * Build Shotstack JSON template for video composition
 */
function buildShotstackTemplate(params: ProduceTestimonialParams) {
  console.log("!!! DEPLOYMENT CHECK - FULL CANVAS CSS STRATEGY ACTIVE !!!");
  console.log("!!! FULL CANVAS TIMESTAMP:", new Date().toISOString(), "!!!");

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

      // ========== VIDEO TRACKS (Track 0 = Top Layer, Track 1 = Bottom Layer) ==========
      tracks: [
        // TRACK 0 (TOP): Text Overlay
        {
          clips: [
            {
              asset: {
                type: 'html',
                html: `<p>${quoteText}</p>`,
                css: 'p { margin: 0; font-size: 36px; color: white; text-align: center; font-weight: bold; }',
                width: 1200,
                height: 120,
                background: 'transparent',
              },
              start: 0,
              length: duration,
              position: 'bottom',
              offset: {
                y: 0.05,
              },
            },
          ],
        },
        // TRACK 1 (BOTTOM): User Video
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
      scaleTo: 'hd',
      quality: 'high',
      // Mux destination - automatically uploads rendered video to Mux
      destinations: [
        {
          provider: 'mux',
          options: {
            playbackPolicy: ['public'],
          },
        },
      ],
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

    // Debug: Verify quoteText is populated
    console.log('🔍 DEBUG - Quote text value:', params.quoteText);
    console.log('🔍 DEBUG - Quote text type:', typeof params.quoteText);
    console.log('🔍 DEBUG - Quote text length:', params.quoteText?.length);

    const template = buildShotstackTemplate(params);

    console.log('🚀 SENDING CANARY PAYLOAD AT', new Date().toISOString());
    console.log('📹 Submitting Shotstack render job...');
    console.log('🐤 CANARY TEMPLATE:', JSON.stringify(template, null, 2));

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

export interface RenderStatusResponse {
  id: string;
  status: 'queued' | 'fetching' | 'rendering' | 'saving' | 'done' | 'failed';
  progress?: number;
  url?: string;
  error?: string;
  mux?: {
    assetId: string;
    playbackId: string;
  };
}

/**
 * Check render job status
 * Returns status, progress, output URL, and Mux asset info when complete
 */
export async function getRenderStatus(renderId: string): Promise<RenderStatusResponse> {
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
    const renderResponse = data.response;

    // Extract Mux destination info if available
    const muxDestination = renderResponse.data?.output?.destinations?.find(
      (d: any) => d.provider === 'mux'
    );

    return {
      id: renderResponse.id,
      status: renderResponse.status,
      progress: renderResponse.progress,
      url: renderResponse.url,
      error: renderResponse.error,
      mux: muxDestination?.meta ? {
        assetId: muxDestination.meta.assetId,
        playbackId: muxDestination.meta.playbackId,
      } : undefined,
    };
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
Example 1: Manual production with custom params

import { produceTestimonial, getRenderStatus } from '@/lib/services/shotstack';

const result = await produceTestimonial({
  videoUrl: 'https://stream.mux.com/{playbackId}/high.mp4',
  quoteText: '"This product is absolutely..."',
  theme: {
    primaryColor: '#FFFFFF',
    secondaryColor: '#E5E5E5',
    tertiaryColor: '#CCCCCC',
    fontFamily: 'Montserrat',
    backgroundType: 'color',
    backgroundColor: '#1a1a2e',
  },
  musicUrl: 'https://cdn.example.com/brand-music.mp3',
  duration: 30,
});

console.log('Render ID:', result.response?.id);

// Poll for status - video is automatically uploaded to Mux when done
const status = await getRenderStatus(result.response.id);
console.log('Status:', status.status);
if (status.mux) {
  console.log('Mux Asset ID:', status.mux.assetId);
  console.log('Mux Playback ID:', status.mux.playbackId);
}

---

Example 2: Automated production via AutomationService

import { processReadyVideo } from '@/lib/services/automation';

// Triggered when video_status = 'ready' and transcription_status = 'completed'
const result = await processReadyVideo(recordingId);

if (result.success) {
  console.log('Render started:', result.renderId);
}
*/
