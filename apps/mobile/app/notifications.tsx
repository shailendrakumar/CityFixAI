import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, H1 } from '../src/components/ui';

const NOTIFS = [
  { id: '1', title: 'Report synced', body: 'Your pothole report was classified as high severity.', time: '2h ago' },
  { id: '2', title: 'Status update', body: 'Report moved to In Progress.', time: '1d ago' },
  { id: '3', title: 'Community', body: 'Your report got 5 upvotes.', time: '3d ago' },
];

export default function Notifications() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>Notifications</H1>
      <Text className="text-gray-600 mt-2 mb-6">Stay updated on your reports.</Text>
      {NOTIFS.map((n) => (
        <Card key={n.id} className="mb-3">
          <Text className="font-semibold text-forest-800">{n.title}</Text>
          <Text className="text-gray-600 text-sm mt-1">{n.body}</Text>
          <Text className="text-xs text-gray-400 mt-2">{n.time}</Text>
        </Card>
      ))}
      <View className="h-8" />
    </ScrollView>
  );
}
