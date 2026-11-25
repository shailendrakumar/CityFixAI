// src/stores/appStore.ts
import { create } from 'zustand';
import type { User } from '../types';

interface AppState {
  dbReady: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  user: User | null;
  demoMode: boolean;
  setDbReady: (v: boolean) => void;
  setOnline: (v: boolean) => void;
  setPendingSyncCount: (n: number) => void;
  setUser: (u: User | null) => void;
  setDemoMode: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  dbReady: false,
  isOnline: true,
  pendingSyncCount: 0,
  user: null,
  demoMode: true,
  setDbReady: (v) => set({ dbReady: v }),
  setOnline: (v) => set({ isOnline: v }),
  setPendingSyncCount: (n) => set({ pendingSyncCount: n }),
  setUser: (u) => set({ user: u }),
  setDemoMode: (v) => set({ demoMode: v }),
}));
