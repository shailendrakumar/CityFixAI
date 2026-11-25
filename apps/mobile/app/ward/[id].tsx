import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getWard } from '../../src/db/repos/wards';
import { listReports } from '../../src/db/repos/reports';
import { Card, H1 } from '../../src/components/ui';
import { DemoBadge } from '../../src/components/DemoBadge';

export default function WardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: ward } = useQuery({ queryKey: ['ward', id], queryFn: () => getWard(id!) });
  const { data: reports = [] } = useQuery({ queryKey: ['ward-reports', id], queryFn: () => listReports({ wardId: id!, limit: 200 }) });
  if (!ward) return <View className="flex-1 items-center justify-center"><Text>Loading…</Text></View>;
  const byStatus = reports.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>{ward.name}</H1>
      {ward.isDemo && <View className="mt-2"><DemoBadge /></View>}
      <Text className="text-gray-600 mt-2 mb-4">{ward.city} · population {ward.population.toLocaleString()}</Text>
      <Card>
        <Text className="font-semibold text-forest-800">Reports: {reports.length}</Text>
        {Object.entries(byStatus).map(([s, n]) => (
          <Text key={s} className="text-gray-700 mt-1">{s}: {n}</Text>
        ))}
      </Card>
      <Text className="text-xs text-gray-400 mt-6 italic">Ward analytics based on platform-tracked community reports (synthetic demo data).</Text>
      <View className="h-8" />
    </ScrollView>
  );
}
