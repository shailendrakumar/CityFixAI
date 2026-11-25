import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Card, H1, Body, Button } from '../src/components/ui';
import { apiFetch } from '../src/services/api';
import { useAppStore } from '../src/stores/appStore';

export default function Volunteer() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [wardId, setWardId] = useState(user?.wardId ?? '');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/volunteers', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, ward_id: wardId || null, skills, availability }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14" accessibilityLabel="Volunteer registration">
      <H1>Volunteer Registration</H1>
      <Body className="mt-2 mb-4">Join community cleanup and civic support (synthetic demo data).</Body>
      {done ? (
        <Card className="bg-emerald-50">
          <Text className="font-semibold text-forest-800">Thanks! Your registration is pending review.</Text>
          <Button title="Back" onPress={() => router.back()} />
        </Card>
      ) : (
        <Card>
          <Text className="text-sm font-medium text-forest-800 mb-1">Name</Text>
          <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-3" value={name} onChangeText={setName} accessibilityLabel="Name" />
          <Text className="text-sm font-medium text-forest-800 mb-1">Email</Text>
          <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-3" value={email} onChangeText={setEmail} accessibilityLabel="Email" />
          <Text className="text-sm font-medium text-forest-800 mb-1">Phone</Text>
          <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-3" value={phone} onChangeText={setPhone} accessibilityLabel="Phone" />
          <Text className="text-sm font-medium text-forest-800 mb-1">Ward ID</Text>
          <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-3" value={wardId} onChangeText={setWardId} accessibilityLabel="Ward ID" />
          <Text className="text-sm font-medium text-forest-800 mb-1">Skills</Text>
          <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-3" value={skills} onChangeText={setSkills} accessibilityLabel="Skills" />
          <Text className="text-sm font-medium text-forest-800 mb-1">Availability</Text>
          <TextInput className="border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 mb-3" value={availability} onChangeText={setAvailability} accessibilityLabel="Availability" />
          {error ? <Text className="text-red-600 mb-2">{error}</Text> : null}
          <Button title={submitting ? 'Submitting...' : 'Register'} onPress={submitting ? undefined : submit} />
          {submitting ? <ActivityIndicator className="mt-2" /> : null}
        </Card>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
