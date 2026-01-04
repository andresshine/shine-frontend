/**
 * useAnswerEvaluation Hook
 * Real-time answer evaluation using Web Speech API + Claude
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface EvaluationResult {
  isComplete: boolean;
  confidence: number;
  followUp: string | null;
}

export interface UseAnswerEvaluationResult {
  isListening: boolean;
  transcript: string;
  evaluation: EvaluationResult | null;
  isEvaluating: boolean;
  startListening: (question: string, questionContext?: string) => void;
  stopListening: () => void;
  resetEvaluation: () => void;
}

export function useAnswerEvaluation(): UseAnswerEvaluationResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const evaluationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentQuestionRef = useRef<string>('');
  const currentContextRef = useRef<string>('');
  const transcriptRef = useRef<string>(''); // Keep ref in sync for interval access
  const lastEvaluatedTranscriptRef = useRef<string>(''); // Avoid duplicate evaluations

  // Keep transcript ref in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Evaluate the current transcript
  const evaluateTranscript = useCallback(async () => {
    const currentTranscript = transcriptRef.current;

    // Skip if transcript hasn't changed significantly
    if (
      currentTranscript.length < 30 ||
      currentTranscript === lastEvaluatedTranscriptRef.current ||
      Math.abs(currentTranscript.length - lastEvaluatedTranscriptRef.current.length) < 20
    ) {
      return;
    }

    lastEvaluatedTranscriptRef.current = currentTranscript;
    setIsEvaluating(true);

    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestionRef.current,
          transcript: currentTranscript,
          questionContext: currentContextRef.current,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEvaluation(result);
        console.log('📊 Evaluation result:', result);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  // Start listening and evaluating
  const startListening = useCallback((question: string, questionContext?: string) => {
    // Store question for evaluation
    currentQuestionRef.current = question;
    currentContextRef.current = questionContext || '';

    // Reset state
    setTranscript('');
    setEvaluation(null);
    transcriptRef.current = '';
    lastEvaluatedTranscriptRef.current = '';

    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Web Speech API not supported in this browser');
      // Fall back to auto-approve after delay
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).trim();
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      // Don't stop on no-speech errors, just log
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      // Restart if we're still supposed to be listening
      if (recognitionRef.current && isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.log('Could not restart recognition');
        }
      }
    };

    // Start recognition
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }

    // Start periodic evaluation (every 3.5 seconds)
    evaluationIntervalRef.current = setInterval(() => {
      evaluateTranscript();
    }, 3500);

  }, [evaluateTranscript, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('🛑 Stopping speech recognition');

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (evaluationIntervalRef.current) {
      clearInterval(evaluationIntervalRef.current);
      evaluationIntervalRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Reset evaluation state
  const resetEvaluation = useCallback(() => {
    setTranscript('');
    setEvaluation(null);
    setIsEvaluating(false);
    transcriptRef.current = '';
    lastEvaluatedTranscriptRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (evaluationIntervalRef.current) {
        clearInterval(evaluationIntervalRef.current);
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    evaluation,
    isEvaluating,
    startListening,
    stopListening,
    resetEvaluation,
  };
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
