import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'narrator_muted';

export function useNarrator() {
  const [muted, setMuted] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const speak = useCallback((text: string) => {
    if (mutedRef.current) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 1.0;
    utter.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    // Priority order: neural/online voices first (much less robotic), then offline female voices
    const voice =
      // Chrome neural voices
      voices.find(v => v.name === 'Google US English') ||
      voices.find(v => /Microsoft.*Natural|Microsoft Aria|Microsoft Jenny|Microsoft Sonia/i.test(v.name)) ||
      // macOS/iOS high-quality voices
      voices.find(v => /Samantha|Karen|Moira|Tessa|Fiona|Veena/i.test(v.name)) ||
      // Windows offline female voices
      voices.find(v => /Zira|Hazel|Susan/i.test(v.name)) ||
      // Fallback: any female-labelled voice
      voices.find(v => /female/i.test(v.name)) ||
      null;

    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      if (next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  // Pre-load voices so they're ready when speak() is first called
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.speechSynthesis.getVoices();
      });
    }
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  return { speak, muted, toggleMute };
}
