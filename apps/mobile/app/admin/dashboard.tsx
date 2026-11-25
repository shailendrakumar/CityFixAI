import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/appStore';
import { apiUrl } from '../../src/services/api';
import { Card, H1, H2 } from '../../src/components/ui';

interface DashboardData {
  total_reports: number;
  pending: number;
  under_review: number;
  in_progress: number;
  verified_resolved: number;
  high_priority: number;
  duplicate_reports: number;
  synthetic_demo_data: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const demoMode = useAppStore((s) => s.demoMode);
  const [token, setToken] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = demoMode || user?.role === 'admin' || user?.role === 'moderator';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/admin/dashboard'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  if (!allowed) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <H1>Access denied</H1>
        <Text className="text-gray-600 mt-2 text-center">Administrator or moderator role required.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4"><Text className="text-forest-600">Back</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>Admin Dashboard</H1>
      <Text className="text-gray-600 text-sm mt-1">Synthetic demo data only. Not a government system.</Text>

      <View className="mt-4">
        <TextInput
          className="border border-forest-200 rounded-xl px-4 py-3 bg-white"
          placeholder="Admin JWT token (for live data)"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={load} className="mt-2 bg-forest-600 rounded-xl py-3 items-center">
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Load dashboard</Text>}
        </TouchableOpacity>
      </View>

      {error && <Text className="text-red-600 mt-3">{error}</Text>}

      {data && (
        <View className="mt-4">
          <View className="flex-row flex-wrap gap-3">
            {[
              ['Total', data.total_reports],
              ['Pending', data.pending],
              ['Under review', data.under_review],
              ['In progress', data.in_progress],
              ['Verified resolved', data.verified_resolved],
              ['High priority', data.high_priority],
              ['Duplicates', data.duplicate_reports],
            ].map(([label, value]) => (
              <Card key={String(label)} className="w-[48%]">
                <Text className="text-xs text-gray-500">{label}</Text>
                <Text className="text-2xl font-bold text-forest-900 mt-1">{value}</Text>
              </Card>
            ))}
          </View>
          {data.synthetic_demo_data && (
            <Text className="text-xs text-gray-400 mt-4 italic">All figures derived from synthetic demo data.</Text>
          )}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}