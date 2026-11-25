import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Card, H1, Body } from '../src/components/ui';
import { apiFetch } from '../src/services/api';

type Leader = { user_id: string; display_name: string; points: number; rank: number; badges: string[] };
type WardLeader = { ward_id: string; ward_name: string; points: number; contributors: number; rank: number };

export default function Leaderboard() {
  const [tab, setTab] = useState<'users' | 'wards'>('users');
  const [users, setUsers] = useState<Leader[]>([]);
  const [wards, setWards] = useState<WardLeader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, w] = await Promise.all([
          apiFetch('/leaderboard').then((r) => r.json()),
          apiFetch('/leaderboard/wards').then((r) => r.json()),
        ]);
        setUsers(Array.isArray(u) ? u : []);
        setWards(Array.isArray(w) ? w : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14" accessibilityLabel="Community leaderboard">
      <H1>Community Leaderboard</H1>
      <Body className="mt-2 mb-4">Top contributors by ward and city (synthetic demo data).</Body>
      <View className="flex-row gap-2 mb-4">
        <Text className={`px-3 py-1 rounded-full ${tab === 'users' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`} onPress={() => setTab('users')}>Citizens</Text>
        <Text className={`px-3 py-1 rounded-full ${tab === 'wards' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`} onPress={() => setTab('wards')}>Wards</Text>
      </View>
      {loading ? <ActivityIndicator /> : null}
      {tab === 'users'
        ? users.map((l) => (
            <Card key={l.user_id} className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-lg font-bold text-forest-700">#{l.rank}</Text>
                <View>
                  <Text className="font-semibold text-forest-900">{l.display_name}</Text>
                  {l.badges.length ? <Text className="text-xs text-gray-500">{l.badges.join(', ')}</Text> : null}
                </View>
              </View>
              <Text className="font-bold text-emerald-600">{l.points} pts</Text>
            </Card>
          ))
        : wards.map((w) => (
            <Card key={w.ward_id} className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-lg font-bold text-forest-700">#{w.rank}</Text>
                <View>
                  <Text className="font-semibold text-forest-900">{w.ward_name}</Text>
                  <Text className="text-xs text-gray-500">{w.contributors} contributors</Text>
                </View>
              </View>
              <Text className="font-bold text-emerald-600">{w.points} pts</Text>
            </Card>
          ))}
      <View className="h-8" />
    </ScrollView>
  );
}
