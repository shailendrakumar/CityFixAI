import { View, Text, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getReport } from '../../src/db/repos/reports';
import { Card, H1, Button } from '../../src/components/ui';
import { SeverityBadge } from '../../src/components/SeverityBadge';
import { SyncStatusChip } from '../../src/components/SyncStatusChip';
import { DemoBadge } from '../../src/components/DemoBadge';

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: report } = useQuery({ queryKey: ['report', id], queryFn: () => getReport(id!) });
  if (!report) return <View className="flex-1 items-center justify-center"><Text>Loading…</Text></View>;

  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>{report.title}</H1>
      <View className="flex-row flex-wrap gap-2 mt-3">
        <SeverityBadge label={report.severityLabel} />
        <SyncStatusChip status={report.syncStatus} />
        {report.isDemo && <DemoBadge />}
      </View>
      <Text className="text-gray-600 mt-2">{report.category} · {report.status} · {new Date(report.createdAt).toLocaleString()}</Text>
      {report.description ? <Card className="mt-4"><Text className="text-gray-700">{report.description}</Text></Card> : null}
      {report.aiRationale ? (
        <Card className="mt-3">
          <Text className="font-semibold text-forest-800">AI (suggestion)</Text>
          <Text className="text-gray-700 mt-1">Category: {report.aiCategory} · Severity: {report.aiSeverity} · Confidence: {report.aiConfidence?.toFixed(2)}</Text>
          <Text className="text-gray-600 text-sm mt-1">{report.aiRationale}</Text>
        </Card>
      ) : null}
      {report.photoUris.map((u) => <Image key={u} source={{ uri: u }} className="w-full h-48 rounded-2xl mt-3" />)}
      <View className="mt-6"><Button title="Back" variant="secondary" onPress={() => router.back()} /></View>
      <Text className="text-xs text-gray-400 mt-6 italic">Platform-tracked status only. Not an official government record.</Text>
      <View className="h-8" />
    </ScrollView>
  );
}
