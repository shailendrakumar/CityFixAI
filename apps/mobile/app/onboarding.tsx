import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui';

export default function Onboarding() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-forest-900">Welcome to CityFixAI</Text>
      <Text className="text-gray-600 mt-2 mb-8">Identify, report and track urban issues in your city — even offline.</Text>
      <View className="bg-forest-50 rounded-2xl p-5 mb-4">
        <Text className="text-forest-800 font-semibold">📸 Capture</Text>
        <Text className="text-gray-600 text-sm mt-1">Snap a photo of any civic issue.</Text>
      </View>
      <View className="bg-emerald-50 rounded-2xl p-5 mb-4">
        <Text className="text-emerald-800 font-semibold">🤖 AI Triage</Text>
        <Text className="text-gray-600 text-sm mt-1">Automatic classification, dedup & severity scoring.</Text>
      </View>
      <View className="bg-forest-50 rounded-2xl p-5 mb-8">
        <Text className="text-forest-800 font-semibold">📊 Track</Text>
        <Text className="text-gray-600 text-sm mt-1">Transparent status timeline for every report.</Text>
      </View>
      <Button title="Get Started" onPress={() => router.push('/(auth)/register')} />
      <View className="h-4" />
      <Button title="I already have an account" variant="ghost" onPress={() => router.push('/(auth)/login')} />
      <View className="h-8" />
    </ScrollView>
  );
}
