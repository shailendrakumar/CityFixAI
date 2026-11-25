import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initDb, getDb } from '../src/db/client';
import { applySchema } from '../src/db/schema';
import { seedDemoData } from '../src/db/seed';
import { upsertCategory } from '../src/db/repos/categories';
import { CATEGORIES_SEED } from '../src/types';
import { useAppStore } from '../src/stores/appStore';
import { useNetworkSync } from '../src/hooks/useNetwork';
import { startSyncLoop } from '../src/services/syncEngine';

import { ensurePhotoDir } from '../src/services/storage';

const queryClient = new QueryClient();
export default function RootLayout() {
  const setDbReady = useAppStore((s) => s.setDbReady);

  useNetworkSync();
  useEffect(() => {
    (async () => {
      await initDb();
      await applySchema();
      for (const c of CATEGORIES_SEED) await upsertCategory({ ...c, isDemo: false });
      const db = await getDb();
      const row: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM reports');
      if ((row?.c ?? 0) === 0) await seedDemoData();
      await ensurePhotoDir();
      setDbReady(true);
      const stop = startSyncLoop();
      return () => stop();
    })();
  }, [setDbReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
