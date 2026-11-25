// src/components/SeverityBadge.tsx
import { View, Text, StyleSheet } from 'react-native';
import type { SeverityLabel } from '../types';

const colors: Record<SeverityLabel, string> = {
  low: '#22c55e', medium: '#eab308', high: '#f97316', critical: '#ef4444',
};

export function SeverityBadge({ label }: { label: SeverityLabel }) {
  return (
    <View style={[styles.badge, { backgroundColor: colors[label] }]}>
      <Text style={styles.text}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  text: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
