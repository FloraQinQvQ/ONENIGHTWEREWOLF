import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY_MUTED = 'narrator_muted';
const STORAGE_KEY_VOLUME = 'narrator_volume';

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find(v => v.name === 'Google US English') ||
    voices.find(v => /Microsoft.*Natural|Microsoft Aria|Microsoft Jenny|Microsoft Sonia/i.test(v.name)) ||
    voices.find(v => /Samantha|Karen|Moira|Tessa|Fiona|Veena/i.test(v.name)) ||
    voices.find(v => /Zira|Hazel|Susan/i.test(v.name)) ||
    voices.find(v => /female/i.test(v.name)) ||
    null
  );
}

export function useNarrator() {
  const [muted, setMuted] = useState(() => localStorage.getItem(STORAGE_KEY_MUTED) === 'true');
  const [volume, setVolumeState] = useState(() => {
    const v = parseFloat(localStorage.getItem(STORAGE_KEY_VOLUME) || '1');
    return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
  });
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  // Cache selected voice so speak() needs zero lookup time
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped));
    setVolumeState(clamped);
  }, []);

  const speak = useCallback((text: string) => {
    if (mutedRef.current) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 1.0;
    utter.volume = volumeRef.current;
    if (voiceRef.current) utter.voice = voiceRef.current;
    window.speechSynthesis.speak(utter);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_MUTED, String(next));
      if (next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  // Pre-load and cache voice; update whenever browser finishes loading voice list
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () => { voiceRef.current = pickVoice(window.speechSynthesis.getVoices()); };
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update);
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, muted, toggleMute, volume, setVolume };
}
