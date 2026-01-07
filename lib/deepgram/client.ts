/**
 * Deepgram Client Configuration
 * Server-side only - uses Deepgram API key for transcription
 */

import { createClient, DeepgramClient } from "@deepgram/sdk";

// Lazy initialization to avoid throwing at module load time
let deepgramClient: DeepgramClient | null = null;

/**
 * Get Deepgram client (lazy initialization)
 */
function getDeepgramClient(): DeepgramClient {
  if (!deepgramClient) {
    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error(
        "Missing Deepgram API key. Please set DEEPGRAM_API_KEY environment variable"
      );
    }
    deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
  }
  return deepgramClient;
}

/**
 * Transcribe audio from a URL
 */
export async function transcribeFromUrl(audioUrl: string) {
  console.log("🎤 Deepgram: Starting transcription from URL:", audioUrl);

  try {
    const deepgram = getDeepgramClient();

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      {
        model: "nova-2",
        smart_format: true,
        punctuate: true,
        paragraphs: true,
        utterances: true,
        diarize: false,
      }
    );

    if (error) {
      console.error("❌ Deepgram transcription error:", error);
      throw error;
    }

    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    const confidence =
      result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    console.log("✅ Deepgram: Transcription successful, length:", transcript.length, "chars");

    return { transcript, confidence, fullResult: result };
  } catch (error) {
    console.error("❌ Deepgram: Error transcribing audio:", error);
    throw error;
  }
}

/**
 * Transcribe audio from a file buffer
 */
export async function transcribeFromBuffer(
  audioBuffer: Buffer,
  mimeType: string = "audio/webm"
) {
  console.log("🎤 Deepgram: Starting transcription from buffer");

  try {
    const deepgram = getDeepgramClient();

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",
        smart_format: true,
        punctuate: true,
        paragraphs: true,
        utterances: true,
        mimetype: mimeType,
      }
    );

    if (error) {
      console.error("❌ Deepgram transcription error:", error);
      throw error;
    }

    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    const confidence =
      result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    console.log("✅ Deepgram: Transcription successful, length:", transcript.length, "chars");

    return { transcript, confidence, fullResult: result };
  } catch (error) {
    console.error("❌ Deepgram: Error transcribing audio:", error);
    throw error;
  }
}
