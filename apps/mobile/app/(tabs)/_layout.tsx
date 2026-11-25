import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#16a34a', tabBarStyle: { backgroundColor: '#fff' } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={String(color ?? '#16a34a')} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color }) => <Ionicons name="map" size={22} color={String(color ?? '#16a34a')} /> }} />
      <Tabs.Screen name="report" options={{ title: 'Report', tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={26} color={String(color ?? '#16a34a')} /> }} />
      <Tabs.Screen name="my-reports" options={{ title: 'Mine', tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={String(color ?? '#16a34a')} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={String(color ?? '#16a34a')} /> }} />
    </Tabs>
  );
}
