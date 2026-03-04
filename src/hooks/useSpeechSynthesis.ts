"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type SpeechLanguage = "en-US" | "ru-RU";

const LANG_PRIORITIES: Record<SpeechLanguage, string[]> = {
  "en-US": ["en-US", "en-GB", "en"],
  "ru-RU": ["ru-RU", "ru"],
};

const pickVoice = (
  voices: SpeechSynthesisVoice[],
  language: SpeechLanguage,
): SpeechSynthesisVoice | null => {
  const priorities = LANG_PRIORITIES[language];

  for (const target of priorities) {
    const voice = voices.find(
      ({ lang }) =>
        lang.toLowerCase() === target.toLowerCase() ||
        lang.toLowerCase().startsWith(`${target.toLowerCase()}-`),
    );

    if (voice) {
      return voice;
    }
  }

  return null;
};

const pickFallbackVoice = (voices: SpeechSynthesisVoice[]) => {
  if (voices.length === 0) {
    return null;
  }

  const preferred =
    voices.find((voice) => voice.default) ??
    voices.find((voice) => voice.localService) ??
    voices[0];

  return preferred ?? null;
};

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const synth = window.speechSynthesis;

    const hydrateVoices = () => {
      setVoices(synth.getVoices());
    };

    hydrateVoices();
    synth.addEventListener("voiceschanged", hydrateVoices);

    return () => {
      synth.removeEventListener("voiceschanged", hydrateVoices);
    };
  }, [isSupported]);

  const voiceMap = useMemo(
    () => ({
      "en-US": pickVoice(voices, "en-US") ?? pickFallbackVoice(voices),
      "ru-RU": pickVoice(voices, "ru-RU") ?? pickFallbackVoice(voices),
    }),
    [voices],
  );

  const stop = useCallback(() => {
    if (!isSupported || typeof window === "undefined") {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, language: SpeechLanguage) => {
      const cleanText = text.trim();
      if (!cleanText || !isSupported || typeof window === "undefined") {
        return false;
      }

      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(cleanText);

      utterance.lang = language;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voice = voiceMap[language];
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      if (synth.paused) {
        synth.resume();
      }

      // Avoid queue race in some mobile browsers after cancel().
      if (synth.speaking || synth.pending) {
        synth.cancel();
      }

      window.setTimeout(() => {
        synth.speak(utterance);
      }, 0);

      return true;
    },
    [isSupported, voiceMap],
  );

  return {
    isSupported,
    isSpeaking,
    speak,
    stop,
  };
}
