/**
 * Quick cleanup script - Delete old Mux assets to free up space
 */

const Mux = require('@mux/mux-node');

const MUX_TOKEN_ID = '05b6e00e-de22-470e-b287-72669b4473f0';
const MUX_TOKEN_SECRET = 'pAEDg7JWnIosdluVoMCl5cvTHSajvCEem45ZVpONBpiKBBl8J7DYwWshHATWNn63x3ogGGRU+eY';

const mux = new Mux({
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
});

async function cleanup() {
  try {
    console.log('🗑️  Fetching all Mux assets...\n');

    const response = await mux.video.assets.list({ limit: 100 });
    const assets = response.data || response;

    console.log(`Found ${assets.length} assets\n`);

    if (assets.length <= 3) {
      console.log('✅ You only have', assets.length, 'assets. No cleanup needed!');
      return;
    }

    // Sort by created date (oldest first)
    const sortedAssets = assets.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateA - dateB;
    });

    // Keep only the 3 most recent, delete the rest
    const assetsToDelete = sortedAssets.slice(0, -3);
    const assetsToKeep = sortedAssets.slice(-3);

    console.log(`📊 Keeping ${assetsToKeep.length} most recent assets:`);
    assetsToKeep.forEach(asset => {
      console.log(`   ✅ ${asset.id} - ${asset.created_at}`);
    });

    console.log(`\n🗑️  Deleting ${assetsToDelete.length} old assets:\n`);

    for (const asset of assetsToDelete) {
      console.log(`   ❌ Deleting ${asset.id} (created ${asset.created_at})...`);
      await mux.video.assets.delete(asset.id);
      console.log(`      ✅ Deleted!`);
    }

    console.log(`\n✅ Cleanup complete! You now have ${assetsToKeep.length} assets (free plan allows 10)`);
    console.log('You can now record new videos!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanup();
