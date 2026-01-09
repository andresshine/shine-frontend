/**
 * Test FFmpeg Audio Extraction and Transcription
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { createClient } = require('@deepgram/sdk');
const { PassThrough } = require('stream');

ffmpeg.setFfmpegPath(ffmpegStatic);

const playbackId = '6F9qAZrp6R7NiOJiOXouVAmgCL3QsQUZSx1bMzCsW5A';
const deepgram = createClient('e5d382ac23c03136e6eb94fe2343ecb0a2ec65a4');

async function testFFmpegTranscription() {
  console.log('🎬 Testing FFmpeg audio extraction and transcription...\n');

  const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
  console.log(`HLS URL: ${hlsUrl}\n`);

  const chunks = [];
  const passThroughStream = new PassThrough();

  console.log('🔊 Extracting audio with FFmpeg...');

  await new Promise((resolve, reject) => {
    ffmpeg(hlsUrl)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('start', (cmd) => {
        console.log('\nFFmpeg command:', cmd, '\n');
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        reject(err);
      })
      .on('end', () => {
        console.log('✅ FFmpeg extraction complete');
        resolve();
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\rProgress: ${progress.percent.toFixed(1)}%`);
        }
      })
      .pipe(passThroughStream);

    passThroughStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
  });

  const audioBuffer = Buffer.concat(chunks);
  console.log(`\nAudio buffer size: ${audioBuffer.length} bytes\n`);

  console.log('🎙️  Transcribing with Deepgram...');

  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        mimetype: 'audio/wav',
      }
    );

    if (error) {
      console.error('❌ Transcription error:', error);
    } else {
      const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      console.log('\n✅ Transcription complete!');
      console.log(`Confidence: ${(confidence * 100).toFixed(1)}%`);
      console.log(`\nTranscript:\n"${transcript}"\n`);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testFFmpegTranscription();
