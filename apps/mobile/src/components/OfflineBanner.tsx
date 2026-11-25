// src/components/OfflineBanner.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../stores/appStore';

export function OfflineBanner() {
  const isOnline = useAppStore((s) => s.isOnline);
  const pending = useAppStore((s) => s.pendingSyncCount);
  if (isOnline && pending === 0) return null;
  return (
    <View style={[styles.banner, isOnline ? styles.sync : styles.offline]}>
      <Text style={styles.text}>
        {isOnline
          ? `${pending} item(s) pending sync`
          : 'Offline — reports saved locally and will sync when online'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 8, alignItems: 'center' },
  offline: { backgroundColor: '#fef3c7' },
  sync: { backgroundColor: '#dbeafe' },
  text: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
});
