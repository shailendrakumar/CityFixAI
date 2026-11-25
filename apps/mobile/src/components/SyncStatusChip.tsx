// src/components/SyncStatusChip.tsx
import { View, Text, StyleSheet } from 'react-native';
import type { SyncStatus } from '../types';

const map: Record<SyncStatus, { bg: string; label: string }> = {
  pending: { bg: '#fde68a', label: 'Pending sync' },
  syncing: { bg: '#bfdbfe', label: 'Syncing' },
  synced: { bg: '#bbf7d0', label: 'Synced' },
  failed: { bg: '#fecaca', label: 'Sync failed' },
};

export function SyncStatusChip({ status }: { status: SyncStatus }) {
  const m = map[status];
  return (
    <View style={[styles.chip, { backgroundColor: m.bg }]}>
      <Text style={styles.text}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '600', color: '#1f2937' },
});
