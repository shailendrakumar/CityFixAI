import { create } from 'zustand';

interface DraftState {
  photoUris: string[];
  title: string;
  description: string;
  category: string;
  lat: number | null;
  lng: number | null;
  address: string;
  wardId: string | null;
  anonymous: boolean;
  setPhotoUris: (v: string[]) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setCategory: (v: string) => void;
  setLocation: (lat: number, lng: number, address: string) => void;
  setWardId: (v: string | null) => void;
  setAnonymous: (v: boolean) => void;
  reset: () => void;
}

const initial = {
  photoUris: [] as string[],
  title: '',
  description: '',
  category: 'other',
  lat: null as number | null,
  lng: null as number | null,
  address: '',
  wardId: null as string | null,
  anonymous: false,
};

export const useReportDraft = create<DraftState>((set) => ({
  ...initial,
  setPhotoUris: (v) => set({ photoUris: v }),
  setTitle: (v) => set({ title: v }),
  setDescription: (v) => set({ description: v }),
  setCategory: (v) => set({ category: v }),
  setLocation: (lat, lng, address) => set({ lat, lng, address }),
  setWardId: (v) => set({ wardId: v }),
  setAnonymous: (v) => set({ anonymous: v }),
  reset: () => set({ ...initial }),
}));
