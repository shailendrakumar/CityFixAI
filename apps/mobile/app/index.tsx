import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function Splash() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace('/onboarding'), 1800);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <View className="flex-1 items-center justify-center bg-forest-700">
      <Text className="text-4xl font-bold text-white">CityFixAI</Text>
      <Text className="text-emerald-200 mt-2">Agentic Civic Intelligence</Text>
    </View>
  );
}
