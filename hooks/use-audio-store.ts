import { create } from "zustand";

interface AudioStore {
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
  setAudioElement: (audio: HTMLAudioElement) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

const useAudioStore = create<AudioStore>((set, get) => ({
  isPlaying: false,
  audioElement: null,

  setAudioElement: (audio: HTMLAudioElement) => set({ audioElement: audio }),

  play: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.play();
      set({ isPlaying: true });
    }
  },

  pause: () => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      set({ isPlaying: false });
    }
  },

  toggle: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  },
}));

export default useAudioStore;
