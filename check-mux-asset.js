const Mux = require('@mux/mux-node');

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const assetId = 'EDTajjgJs8hpe1bjwHazbXv2g2aBcS7EVUlS3rwXeiA';

async function checkAsset() {
  try {
    const asset = await mux.video.assets.retrieve(assetId);

    console.log('\n=== MUX ASSET DETAILS ===');
    console.log('Asset ID:', asset.id);
    console.log('Status:', asset.status);
    console.log('Duration:', asset.duration, 'seconds');
    console.log('Encoding Tier:', asset.encoding_tier);
    console.log('Max Stored Resolution:', asset.max_stored_resolution);
    console.log('Max Stored Frame Rate:', asset.max_stored_frame_rate);
    console.log('Aspect Ratio:', asset.aspect_ratio);
    console.log('\n=== VIDEO TRACKS ===');
    if (asset.tracks && asset.tracks.length > 0) {
      asset.tracks.forEach((track, i) => {
        if (track.type === 'video') {
          console.log(`Video Track ${i}:`);
          console.log('  - Max Width:', track.max_width);
          console.log('  - Max Height:', track.max_height);
          console.log('  - Max Frame Rate:', track.max_frame_rate);
        }
      });
    }
    console.log('\n=== PLAYBACK IDS ===');
    if (asset.playback_ids && asset.playback_ids.length > 0) {
      asset.playback_ids.forEach(playback => {
        console.log('Playback ID:', playback.id);
      });
    }
    console.log('\n');
  } catch (error) {
    console.error('Error fetching asset:', error);
  }
}

checkAsset();
