/**
 * ElevenLabs Voice Service
 * Client-side service for Text-to-Speech functionality
 */

export class VoiceService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  /**
   * Speak text using ElevenLabs TTS
   */
  async speak(text: string): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      console.log(`🎙️ Speaking: "${text.substring(0, 50)}..."`);

      // Call the TTS API endpoint
      const response = await fetch('/api/elevenlabs/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio element
      this.audio = new Audio(audioUrl);
      this.isPlaying = true;

      // Return promise that resolves when audio finishes
      return new Promise((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio element not created'));
          return;
        }

        this.audio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        this.audio.onerror = (error) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        this.audio.play().catch(reject);
      });
    } catch (error) {
      console.error('❌ Voice service error:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * Stop currently playing audio
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
      this.isPlaying = false;
    }
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Singleton instance
let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
}
