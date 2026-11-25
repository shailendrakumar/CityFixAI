import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listReports } from '../../src/db/repos/reports';
import { OSMMapView } from '../../src/components/OSMMapView';
import { Card, H2 } from '../../src/components/ui';
import { SeverityBadge } from '../../src/components/SeverityBadge';
import { useAppStore } from '../../src/stores/appStore';
import { SyncStatusChip } from '../../src/components/SyncStatusChip';

const CATEGORIES = ['all', 'pothole', 'streetlight', 'water_leak', 'trash', 'sidewalk', 'graffiti', 'traffic_signal', 'other'];
const SEVERITIES = ['all', 'low', 'medium', 'high', 'critical'];

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function CityMap() {
  const router = useRouter();
  const isOnline = useAppStore((s) => s.isOnline);
  const { data: reports = [] } = useQuery({ queryKey: ['reports'], queryFn: () => listReports({ limit: 500 }) });
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (category !== 'all' && r.category !== category) return false;
      if (severity !== 'all' && r.severityLabel !== severity) return false;
      return true;
    });
  }, [reports, category, severity]);

  const nearby = useMemo(() => {
    if (!selected) return [];
    return reports
      .filter((r) => r.id !== selected.id)
      .map((r) => ({ r, d: distanceMeters(selected, r) }))
      .filter((x) => x.d <= 500)
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);
  }, [selected, reports]);

  return (
    <ScrollView className="flex-1 bg-forest-50">
      <View className="px-5 pt-14 pb-4">
        <H2>City Issue Map</H2>
        <Text className="text-gray-600 text-sm">OpenStreetMap · pins by severity · synthetic demo data</Text>
        {!isOnline && (
          <View className="mt-2 bg-amber-100 rounded-xl px-3 py-2">
            <Text className="text-amber-800 text-xs font-semibold">Offline: showing cached report coordinates. Map tiles may be limited.</Text>
          </View>
        )}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-2">
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} className={`mr-2 px-3 py-1 rounded-full ${category === c ? 'bg-forest-600' : 'bg-white border border-forest-100'}`}>
            <Text className={`text-xs ${category === c ? 'text-white' : 'text-forest-800'}`}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-3">
        {SEVERITIES.map((s) => (
          <TouchableOpacity key={s} onPress={() => setSeverity(s)} className={`mr-2 px-3 py-1 rounded-full ${severity === s ? 'bg-forest-600' : 'bg-white border border-forest-100'}`}>
            <Text className={`text-xs ${severity === s ? 'text-white' : 'text-forest-800'}`}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="mx-5">
        <OSMMapView reports={filtered} selectedId={selected?.id} onSelectReport={setSelected} height={380} />
      </View>

      {selected && (
        <View className="px-5 mt-4">
          <Card>
            <TouchableOpacity onPress={() => router.push(`/report/${selected.id}`)}>
              <Text className="font-semibold text-forest-900">{selected.title}</Text>
              <Text className="text-gray-600 text-sm mt-1">{selected.category} · {selected.status}</Text>
              <View className="flex-row items-center gap-2 mt-2">
                <SeverityBadge label={selected.severityLabel} />
                <SyncStatusChip status={selected.syncStatus} />
              </View>
              <Text className="text-xs text-gray-500 mt-2">Lat: {selected.lat.toFixed(5)} Lng: {selected.lng.toFixed(5)}</Text>
            </TouchableOpacity>
            {nearby.length > 0 && (
              <View className="mt-3">
                <Text className="font-semibold text-forest-800 text-sm">Nearby reports ({nearby.length})</Text>
                {nearby.map(({ r, d }) => (
                  <TouchableOpacity key={r.id} onPress={() => setSelected(r)} className="mt-2">
                    <Text className="text-sm text-forest-700">{r.title} — {Math.round(d)}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}

      <View className="px-5 mt-4">
        <Card>
          <Text className="font-semibold text-forest-800">Legend</Text>
          <Text className="text-xs text-gray-600 mt-1">Marker color = severity (green low, yellow medium, orange high, red critical). Circles = hotspots (3+ reports within 250m). Clustered pins show counts.</Text>
        </Card>
      </View>
      <View className="h-8" />
    </ScrollView>
  );
}
