import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listWards } from '../src/db/repos/wards';
import { Card, H1 } from '../src/components/ui';
import { DemoBadge } from '../src/components/DemoBadge';

export default function Wards() {
  const router = useRouter();
  const { data: wards = [] } = useQuery({ queryKey: ['wards'], queryFn: listWards });
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>Wards</H1>
      <Text className="text-gray-600 mt-2 mb-6">Synthetic demo wards.</Text>
      {wards.map((w) => (
        <Card key={w.id} className="mb-3">
          <TouchableOpacity onPress={() => router.push(`/ward/${w.id}`)}>
            <Text className="font-semibold text-forest-800">{w.name}</Text>
            <Text className="text-gray-600 text-sm mt-1">{w.city} · pop. {w.population.toLocaleString()}</Text>
            {w.isDemo && <View className="mt-2"><DemoBadge /></View>}
          </TouchableOpacity>
        </Card>
      ))}
      <View className="h-8" />
    </ScrollView>
  );
}
