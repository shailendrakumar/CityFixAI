// src/components/SchematicMap.tsx
// Lightweight, cross-platform schematic map for demo. Not a real map provider.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { Report } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface Props {
  reports: Report[];
  onPressReport?: (r: Report) => void;
  height?: number;
}

export function SchematicMap({ reports, onPressReport, height = 320 }: Props) {
  // bounding box from reports (or demo default)
  const lats = reports.map((r) => r.lat);
  const lngs = reports.map((r) => r.lng);
  const minLat = lats.length ? Math.min(...lats) - 0.005 : 40.70;
  const maxLat = lats.length ? Math.max(...lats) + 0.005 : 40.73;
  const minLng = lngs.length ? Math.min(...lngs) - 0.005 : -74.02;
  const maxLng = lngs.length ? Math.max(...lngs) + 0.005 : -73.98;

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.label}>SYNTHETIC DEMO MAP (schematic) — pins by severity</Text>
      <View style={styles.canvas}>
        {reports.map((r) => {
          const x = ((r.lng - minLng) / (maxLng - minLng)) * 100;
          const y = (1 - (r.lat - minLat) / (maxLat - minLat)) * 100;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.pin, { left: `${Math.min(95, Math.max(2, x))}%`, top: `${Math.min(95, Math.max(2, y))}%` }]}
              onPress={() => onPressReport?.(r)}
            >
              <SeverityBadge label={r.severityLabel} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', margin: 12 },
  label: { fontSize: 10, color: '#6b7280', padding: 6, textAlign: 'center', backgroundColor: '#f3f4f6' },
  canvas: { flex: 1, position: 'relative' },
  pin: { position: 'absolute' },
});
