/**
 * Deepgram Client Configuration
 * Server-side only - uses Deepgram API key for transcription
 */

import { createClient } from "@deepgram/sdk";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error(
    "Missing Deepgram API key. Please set DEEPGRAM_API_KEY in .env.local"
  );
}

// Initialize Deepgram client
export const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

/**
 * Transcribe audio from a URL
 */
export async function transcribeFromUrl(audioUrl: string) {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      {
        url: audioUrl,
      },
      {
        model: "nova-2",
        smart_format: true,
        punctuate: true,
        paragraphs: true,
        utterances: true,
        diarize: false, // Set to true if you want speaker detection
      }
    );

    if (error) {
      console.error("Deepgram transcription error:", error);
      throw error;
    }

    // Extract the transcript
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    // Extract confidence score
    const confidence =
      result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return {
      transcript,
      confidence,
      fullResult: result,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
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
  try {
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
      console.error("Deepgram transcription error:", error);
      throw error;
    }

    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    const confidence =
      result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return {
      transcript,
      confidence,
      fullResult: result,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}
