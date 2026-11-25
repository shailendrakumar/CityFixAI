import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function ReportTab() {
  const router = useRouter();
  useEffect(() => { router.replace('/report/camera'); }, [router]);
  return <View className="flex-1 bg-forest-50" />;
}
