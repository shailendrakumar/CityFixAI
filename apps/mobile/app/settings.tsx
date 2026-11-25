import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '../src/stores/appStore';
import { Card, H1 } from '../src/components/ui';

export default function Settings() {
  const isOnline = useAppStore((s) => s.isOnline);
  const pending = useAppStore((s) => s.pendingSyncCount);
  const demoMode = useAppStore((s) => s.demoMode);
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>Settings & Offline Status</H1>
      <Text className="text-gray-600 mt-2 mb-6">App preferences and sync health.</Text>
      <Card className="mb-3">
        <Text className="font-semibold text-forest-800">Network</Text>
        <Text className={`mt-1 ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>{isOnline ? 'Online' : 'Offline'}</Text>
      </Card>
      <Card className="mb-3">
        <Text className="font-semibold text-forest-800">Pending sync queue</Text>
        <Text className="mt-1 text-gray-700">{pending} item(s)</Text>
      </Card>
      <Card className="mb-3">
        <Text className="font-semibold text-forest-800">Demo mode</Text>
        <Text className="mt-1 text-gray-700">{demoMode ? 'Enabled (synthetic demo data)' : 'Disabled'}</Text>
      </Card>
      <Card className="mb-3">
        <Text className="font-semibold text-forest-800">Theme</Text>
        <Text className="mt-1 text-gray-700">Light (initial)</Text>
      </Card>
      <Card className="mb-3">
        <Text className="font-semibold text-forest-800">Location precision</Text>
        <Text className="mt-1 text-gray-700">Exact (configurable)</Text>
      </Card>
      <View className="h-8" />
    </ScrollView>
  );
}
