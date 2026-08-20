import { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../utils/audioSynthesizer';

// SpeechRecognition type declarations for browser support
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (event: SpeechRecognitionErrorEventLike) => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check browser speech recognition support
  useEffect(() => {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      setHasSpeechSupport(false);
    }
  }, []);

  // Cleanup microphone and audio meter
  const cleanupAudioAnalyser = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignored
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start Web Audio analyser for live sound level meter
  const startAudioMeter = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err: any) {
      console.warn('Microphone audio meter not available:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignored
      }
    }
    cleanupAudioAnalyser();
    setIsListening(false);
  }, [cleanupAudioAnalyser]);

  const startListening = useCallback(
    (customLang = 'es-ES') => {
      setErrorMessage(null);
      setTranscript('');
      setInterimTranscript('');

      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechClass) {
        setHasSpeechSupport(false);
        setErrorMessage(
          'Tu navegador no soporta la API nativa de reconocimiento de voz de forma directa, pero puedes probar con los comandos de ejemplo o escribir directamente.'
        );
        return;
      }

      try {
        // Sound feedback
        soundEngine.playChime('start');

        const recognition = new SpeechClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = customLang;

        recognition.onstart = () => {
          setIsListening(true);
          startAudioMeter();
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let finalAccumulated = '';
          let interimAccumulated = '';

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              finalAccumulated += res[0].transcript + ' ';
            } else {
              interimAccumulated += res[0].transcript;
            }
          }

          if (finalAccumulated.trim()) {
            setTranscript(finalAccumulated.trim());
          }
          setInterimTranscript(interimAccumulated.trim());
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          console.warn('Speech recognition error:', event.error, event.message);
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            setErrorMessage('Permiso de micrófono denegado. Habilita el acceso al micrófono en la barra de tu navegador.');
          } else if (event.error === 'no-speech') {
            // No speech detected, wait
          } else if (event.error === 'network') {
            setErrorMessage('Problema de conexión con el servicio de reconocimiento de voz. Puedes usar el botón de prueba o escribir.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          cleanupAudioAnalyser();
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setErrorMessage('No se pudo inicializar el micrófono: ' + (err?.message || 'Error desconocido'));
        setIsListening(false);
        cleanupAudioAnalyser();
      }
    },
    [startAudioMeter, cleanupAudioAnalyser]
  );

  // Set manual transcript (e.g. for testing predefined examples like 'Tengo examen de Anatomía el viernes')
  const setSimulatedSpeech = useCallback((text: string) => {
    setTranscript(text);
    setInterimTranscript('');
    setErrorMessage(null);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    errorMessage,
    hasSpeechSupport,
    startListening,
    stopListening,
    setSimulatedSpeech,
    resetTranscript,
  };
}
