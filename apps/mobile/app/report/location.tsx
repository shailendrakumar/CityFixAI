import { View, Text, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Button, Card, H1 } from '../../src/components/ui';
import { useReportDraft } from '../../src/stores/reportDraftStore';

export default function LocationScreen() {
  const router = useRouter();
  const draft = useReportDraft();
  const detect = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const loc = await Location.getCurrentPositionAsync({});
    const [place] = await Location.reverseGeocodeAsync(loc.coords);
    const addr = place ? `${place.street || ''} ${place.city || ''}`.trim() : '';
    draft.setLocation(loc.coords.latitude, loc.coords.longitude, addr);
  };
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>Location</H1>
      <Text className="text-gray-600 mt-2 mb-6">Where is the issue?</Text>
      <Button title="Detect my location" onPress={detect} />
      {draft.lat != null && (
        <Card className="mt-4">
          <Text className="font-semibold text-forest-800">Lat: {draft.lat.toFixed(5)}</Text>
          <Text className="font-semibold text-forest-800">Lng: {draft.lng?.toFixed(5)}</Text>
          <Text className="text-gray-600 text-sm mt-1">{draft.address}</Text>
        </Card>
      )}
      <Text className="text-sm font-medium text-forest-800 mt-6 mb-1">Address / notes</Text>
      <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-white" value={draft.address} onChangeText={(t) => draft.setLocation(draft.lat ?? 0, draft.lng ?? 0, t)} placeholder="Street, landmark..." />
      <View className="mt-6"><Button title="Next: AI Preview" onPress={() => router.push('/report/ai-preview')} /></View>
      <View className="h-8" />
    </ScrollView>
  );
}
