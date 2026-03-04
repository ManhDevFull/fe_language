"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SpeechLanguage, useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

const buildTTSUrl = (text: string, language: SpeechLanguage) => {
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("lang", language);
  params.set("_t", String(Date.now()));
  return `/api/v1/tts?${params.toString()}`;
};

export function usePronunciation() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const {
    isSupported,
    isSpeaking,
    speak: speakNative,
    stop: stopNative,
  } = useSpeechSynthesis();

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    stopNative();
    setIsPlaying(false);
  }, [stopNative]);

  const speak = useCallback(
    async (text: string, language: SpeechLanguage) => {
      const cleanText = text.trim();
      if (!cleanText) {
        return false;
      }

      stop();

      const audio = new Audio(buildTTSUrl(cleanText, language));
      audio.preload = "auto";

      audio.onplay = () => {
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };

      audioRef.current = audio;

      try {
        await audio.play();
        return true;
      } catch {
        audioRef.current = null;
        setIsPlaying(false);

        if (isSupported) {
          return speakNative(cleanText, language);
        }

        return false;
      }
    },
    [isSupported, speakNative, stop],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying: isPlaying || isSpeaking,
    speak,
    stop,
  };
}
