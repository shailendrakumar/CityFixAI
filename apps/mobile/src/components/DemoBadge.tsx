// src/components/DemoBadge.tsx
import { View, Text, StyleSheet } from 'react-native';

export function DemoBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>SYNTHETIC DEMO DATA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: '#fde68a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  text: { fontSize: 9, fontWeight: '700', color: '#92400e' },
});
