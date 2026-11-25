import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CATEGORIES_SEED } from '../../src/types';
import { Button, Card, H1 } from '../../src/components/ui';
import { useReportDraft } from '../../src/stores/reportDraftStore';

export default function CategoryScreen() {
  const router = useRouter();
  const draft = useReportDraft();
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>Issue Category</H1>
      <Text className="text-gray-600 mt-2 mb-6">Select the category that best fits.</Text>
      <View className="flex-row flex-wrap gap-3">
        {CATEGORIES_SEED.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => draft.setCategory(c.id)} className={`w-[48%] rounded-2xl p-4 border ${draft.category === c.id ? 'bg-forest-600 border-forest-600' : 'bg-white border-forest-100'}`}>
            <Text className="text-2xl">{c.icon}</Text>
            <Text className={`mt-2 font-semibold ${draft.category === c.id ? 'text-white' : 'text-forest-800'}`}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="mt-6"><Button title="Next: Location" onPress={() => router.push('/report/location')} /></View>
      <View className="h-8" />
    </ScrollView>
  );
}
