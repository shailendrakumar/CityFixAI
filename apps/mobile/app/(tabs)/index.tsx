import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listReports } from '../../src/db/repos/reports';
import { Button, Card, H1, H2, Body } from '../../src/components/ui';
import { SeverityBadge } from '../../src/components/SeverityBadge';
import { SyncStatusChip } from '../../src/components/SyncStatusChip';

export default function HomeDashboard() {
  const router = useRouter();
  const { data: reports = [] } = useQuery({ queryKey: ['reports'], queryFn: () => listReports({ limit: 50 }) });
  const open = reports.filter((r) => r.status === 'open').length;
  const inProgress = reports.filter((r) => r.status === 'in_progress').length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;

  return (
    <ScrollView className="flex-1 bg-forest-50">
      <View className="px-5 pt-14 pb-4 bg-forest-700 rounded-b-3xl">
        <Text className="text-emerald-200 text-sm">Good morning</Text>
        <H1 className="text-white">CityFixAI</H1>
        <Text className="text-emerald-100 mt-1">Your city, your reports.</Text>
      </View>

      <View className="px-5 -mt-6">
        <Card className="flex-row justify-between">
          <View className="items-center flex-1"><Text className="text-2xl font-bold text-forest-700">{open}</Text><Text className="text-xs text-gray-500">Open</Text></View>
          <View className="items-center flex-1"><Text className="text-2xl font-bold text-amber-600">{inProgress}</Text><Text className="text-xs text-gray-500">In progress</Text></View>
          <View className="items-center flex-1"><Text className="text-2xl font-bold text-emerald-600">{resolved}</Text><Text className="text-xs text-gray-500">Resolved</Text></View>
        </Card>
      </View>

      <View className="px-5 mt-5">
        <H2>Quick actions</H2>
        <View className="flex-row gap-3 mt-3">
          <View className="flex-1"><Button title="Report issue" onPress={() => router.push('/report/camera')} /></View>
          <View className="flex-1"><Button title="View map" variant="secondary" onPress={() => router.push('/(tabs)/map')} /></View>
        </View>
      </View>

      <View className="px-5 mt-5">
        <View className="flex-row justify-between items-center">
          <H2>Recent reports</H2>
          <TouchableOpacity onPress={() => router.push('/(tabs)/my-reports')}><Text className="text-forest-600 text-sm font-medium">See all</Text></TouchableOpacity>
        </View>
        {reports.slice(0, 5).map((r) => (
          <Card key={r.id} className="mt-3">
            <TouchableOpacity onPress={() => router.push(`/report/${r.id}`)}>
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-forest-900 flex-1" numberOfLines={1}>{r.title}</Text>
                <SeverityBadge label={r.severityLabel} />
              </View>
              <Body className="mt-1">{r.category} · {r.status}</Body>
              <View className="mt-2"><SyncStatusChip status={r.syncStatus} /></View>
            </TouchableOpacity>
          </Card>
        ))}
      </View>
      <View className="h-8" />
    </ScrollView>
  );
}
