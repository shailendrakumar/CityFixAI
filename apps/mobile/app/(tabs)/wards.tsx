import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listWards } from '../../src/db/repos/wards';
import { listReports } from '../../src/db/repos/reports';
import { DemoBadge } from '../../src/components/DemoBadge';

export default function Wards() {
  const router = useRouter();
  const { data: wards = [] } = useQuery({ queryKey: ['wards'], queryFn: listWards });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Wards (SYNTHETIC DEMO)</Text>
      <FlatList
        data={wards}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/ward/${item.id}`)}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>{item.city} · pop. {item.population.toLocaleString()}</Text>
            {item.isDemo && <DemoBadge />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 16, fontWeight: '700', padding: 12 },
  card: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
