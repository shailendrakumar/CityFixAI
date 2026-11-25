import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, H1, H2 } from '../../src/components/ui';

export default function Profile() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-forest-50">
      <View className="px-5 pt-14 pb-6 bg-forest-700 rounded-b-3xl items-center">
        <View className="w-20 h-20 rounded-full bg-emerald-400 items-center justify-center">
          <Text className="text-2xl font-bold text-white">DC</Text>
        </View>
        <Text className="text-white text-xl font-bold mt-3">Demo Citizen</Text>
        <Text className="text-emerald-200 text-sm">demo1@example.com</Text>
      </View>
      <View className="px-5 mt-5 gap-3">
        <Card><TouchableOpacity onPress={() => router.push('/leaderboard')}><Text className="font-semibold text-forest-800">🏆 Leaderboard</Text></TouchableOpacity></Card>
        <Card><TouchableOpacity onPress={() => router.push('/rewards')}><Text className="font-semibold text-forest-800">🎁 Rewards & Achievements</Text></TouchableOpacity></Card>
        <Card><TouchableOpacity onPress={() => router.push('/notifications')}><Text className="font-semibold text-forest-800">🔔 Notifications</Text></TouchableOpacity></Card>
        <Card><TouchableOpacity onPress={() => router.push('/settings')}><Text className="font-semibold text-forest-800">⚙️ Settings & Offline status</Text></TouchableOpacity></Card>
        <Card><TouchableOpacity onPress={() => router.push('/wards')}><Text className="font-semibold text-forest-800">📍 Wards & Analytics</Text></TouchableOpacity></Card>
        <Card><TouchableOpacity onPress={() => router.push('/volunteer')}><Text className="font-semibold text-forest-800">🤝 Volunteer Registration</Text></TouchableOpacity></Card>
      </View>
      <View className="px-5 mt-6">
        <Button title="Sign out" variant="ghost" onPress={() => router.replace('/onboarding')} />
      </View>
      <View className="h-8" />
    </ScrollView>
  );
}
