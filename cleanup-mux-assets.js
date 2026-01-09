/**
 * Cleanup Old Mux Assets
 * Delete old test assets to free up space on free plan
 */

const Mux = require('@mux/mux-node').default;
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

const mux = new Mux({
  tokenId: '05b6e00e-de22-470e-b287-72669b4473f0',
  tokenSecret: 'pAEDg7JWnIosdluVoMCl5cvTHSajvCEem45ZVpONBpiKBBl8J7DYwWshHATWNn63x3ogGGRU+eY',
});

const supabase = createSupabaseClient(
  'https://uhtuxvbwlttsrhcbxeou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0'
);

async function cleanupAssets() {
  console.log('🗑️  Cleaning up old Mux assets...\n');

  try {
    // List all assets
    const { data: assets } = await mux.video.assets.list({ limit: 100 });

    console.log(`Found ${assets.length} total assets\n`);

    // Get all recordings from database
    const { data: recordings } = await supabase
      .from('recordings')
      .select('mux_asset_id')
      .not('mux_asset_id', 'is', null);

    const dbAssetIds = new Set(recordings?.map(r => r.mux_asset_id) || []);
    console.log(`Database has ${dbAssetIds.size} asset IDs\n`);

    let deletedCount = 0;

    for (const asset of assets) {
      // Skip if this asset is in the database
      if (dbAssetIds.has(asset.id)) {
        console.log(`⏭️  Keeping ${asset.id} (in database)`);
        continue;
      }

      // Delete asset not in database
      console.log(`❌ Deleting ${asset.id}...`);
      try {
        await mux.video.assets.delete(asset.id);
        deletedCount++;
        console.log(`   ✅ Deleted`);
      } catch (deleteError) {
        console.log(`   ⚠️  Error: ${deleteError.message}`);
      }

      // Wait a bit between deletions
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} assets.`);
    console.log(`Remaining assets: ${assets.length - deletedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupAssets();
