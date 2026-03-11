import { create } from 'zustand';

export type Lang = 'en' | 'zh';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const stored = localStorage.getItem('lang') as Lang | null;

export const useLangStore = create<LangStore>((set) => ({
  lang: stored === 'zh' ? 'zh' : 'en',
  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    set({ lang });
  },
}));
