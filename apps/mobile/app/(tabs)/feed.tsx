import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listReports } from '../../src/db/repos/reports';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { DemoBadge } from '../../src/components/DemoBadge';
import { SeverityBadge } from '../../src/components/SeverityBadge';

export default function Feed() {
  const router = useRouter();
  const { data: reports = [] } = useQuery({ queryKey: ['feed'], queryFn: () => listReports({ limit: 200 }) });

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={<Text style={styles.header}>Community Feed (SYNTHETIC DEMO DATA)</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/report/${item.id}`)}>
            <View style={styles.row}>
              <SeverityBadge label={item.severityLabel} />
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            </View>
            <Text style={styles.meta}>{item.category} · {item.status} · upvotes {item.upvoteCount}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
