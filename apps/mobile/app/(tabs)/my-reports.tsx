import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listReports } from '../../src/db/repos/reports';
import { Card, H1 } from '../../src/components/ui';
import { SeverityBadge } from '../../src/components/SeverityBadge';
import { SyncStatusChip } from '../../src/components/SyncStatusChip';

export default function MyReports() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: reports = [] } = useQuery({ queryKey: ['myreports'], queryFn: () => listReports({ limit: 100 }) });
  useFocusEffect(useCallback(() => { qc.invalidateQueries({ queryKey: ['myreports'] }); }, [qc]));
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>My Reports</H1>
      <Text className="text-gray-600 mt-2 mb-6">{reports.length} reports</Text>
      {reports.map((r) => (
        <Card key={r.id} className="mb-3">
          <TouchableOpacity onPress={() => router.push(`/report/${r.id}`)}>
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-forest-900 flex-1" numberOfLines={1}>{r.title}</Text>
              <SeverityBadge label={r.severityLabel} />
            </View>
            <Text className="text-gray-600 text-sm mt-1">{r.category} · {r.status}</Text>
            <View className="mt-2"><SyncStatusChip status={r.syncStatus} /></View>
          </TouchableOpacity>
        </Card>
      ))}
      <View className="h-8" />
    </ScrollView>
  );
}
