import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}><Text>Screen not found</Text><Link href="/"><Text style={styles.link}>Go home</Text></Link></View>
    </>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' }, link: { color: '#2563eb', marginTop: 8 } });
