// src/hooks/useNetwork.ts
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { initNetworkMonitor, subscribe, isOnline } from '../networkMonitor';

export function useNetworkSync() {
  const setOnline = useAppStore((s) => s.setOnline);
  useEffect(() => {
    initNetworkMonitor().catch(() => {});
    const unsub = subscribe((state) => {
      setOnline(state.isConnected && state.isInternetReachable !== false);
    });
    setOnline(isOnline());
    return () => unsub();
  }, [setOnline]);
}
