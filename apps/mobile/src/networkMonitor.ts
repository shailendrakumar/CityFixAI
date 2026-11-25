// src/networkMonitor.ts
import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from './stores/appStore';

export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
};

let currentState: NetworkState = {
  isConnected: true,
  isInternetReachable: null,
  type: null,
};

const listeners = new Set<(state: NetworkState) => void>();

function normalize(state: any): NetworkState {
  return {
    isConnected: !!(state?.isConnected),
    isInternetReachable: state?.isInternetReachable ?? null,
    type: state?.type ?? null,
  };
}

export function getNetworkState(): NetworkState {
  return currentState;
}

export function isOnline(): boolean {
  return currentState.isConnected && currentState.isInternetReachable !== false;
}

export function subscribe(listener: (state: NetworkState) => void): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}

export async function initNetworkMonitor(): Promise<void> {
  const state = await NetInfo.fetch();
  currentState = normalize(state);
  useAppStore.getState().setOnline(isOnline());
  NetInfo.addEventListener((state) => {
    currentState = normalize(state);
    useAppStore.getState().setOnline(isOnline());
    listeners.forEach((l) => l(currentState));
  });
}

export async function waitForOnline(timeoutMs = 10000): Promise<boolean> {
  if (isOnline()) return true;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve(isOnline());
    }, timeoutMs);
    const unsub = subscribe((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        clearTimeout(timer);
        unsub();
        resolve(true);
      }
    });
  });
}

export async function checkServerReachable(baseUrl: string, timeoutMs = 5000): Promise<boolean> {
  if (!isOnline()) return false;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, { signal: controller.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export function useNetworkMonitor() {
  // Convenience hook for React components.
  const setOnline = useAppStore((s) => s.setOnline);
  // Lazy init on first use.
  if (typeof window !== 'undefined') {
    // no-op placeholder; components should call initNetworkMonitor at app start
  }
  return { isOnline: isOnline(), setOnline };
}