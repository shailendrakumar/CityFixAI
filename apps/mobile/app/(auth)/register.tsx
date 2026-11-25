import { View, Text, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui';

export default function Register() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-forest-900">Create account</Text>
      <Text className="text-gray-600 mt-2 mb-8">Join your community.</Text>
      <Text className="text-sm font-medium text-forest-800 mb-1">Name</Text>
      <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-4" placeholder="Your name" />
      <Text className="text-sm font-medium text-forest-800 mb-1">Email</Text>
      <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-4" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
      <Text className="text-sm font-medium text-forest-800 mb-1">Password</Text>
      <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-6" placeholder="••••••••" secureTextEntry />
      <Button title="Create Account" onPress={() => router.replace('/(tabs)')} />
      <View className="h-4" />
      <Button title="Already have an account" variant="ghost" onPress={() => router.push('/(auth)/login')} />
    </ScrollView>
  );
}
