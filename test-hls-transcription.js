/**
 * Test HLS Download and Transcription
 */

const m3u8stream = require('m3u8stream');
const { createClient } = require('@deepgram/sdk');

const playbackId = '6F9qAZrp6R7NiOJiOXouVAmgCL3QsQUZSx1bMzCsW5A';
const deepgram = createClient('e5d382ac23c03136e6eb94fe2343ecb0a2ec65a4');

async function testTranscription() {
  console.log('🎬 Testing HLS download and transcription...\n');

  const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
  console.log(`Downloading from: ${hlsUrl}\n`);

  const stream = m3u8stream(hlsUrl, { begin: 0 });
  const chunks = [];

  await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      chunks.push(chunk);
      process.stdout.write(`\rDownloaded: ${Buffer.concat(chunks).length} bytes`);
    });

    stream.on('end', () => {
      console.log('\n✅ Download complete');
      resolve();
    });

    stream.on('error', (error) => {
      console.error('\n❌ Download error:', error.message);
      reject(error);
    });
  });

  const videoBuffer = Buffer.concat(chunks);
  console.log(`Total size: ${videoBuffer.length} bytes\n`);

  console.log('🎙️  Transcribing...');

  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      videoBuffer,
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        mimetype: 'video/mp2t',
      }
    );

    if (error) {
      console.error('❌ Transcription error:', error);
    } else {
      const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      console.log('✅ Transcription complete!');
      console.log(`Confidence: ${(confidence * 100).toFixed(1)}%`);
      console.log(`\nTranscript: "${transcript}"`);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testTranscription();
