import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, H1 } from '../../src/components/ui';
import { useReportDraft } from '../../src/stores/reportDraftStore';
import { savePhoto } from '../../src/services/storage';

export default function CameraScreen() {
  const router = useRouter();
  const draft = useReportDraft();
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) {
      const saved = await savePhoto(res.assets[0].uri);
      draft.setPhotoUris([...draft.photoUris, saved]);
    }
  };
  const shoot = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) {
      const saved = await savePhoto(res.assets[0].uri);
      draft.setPhotoUris([...draft.photoUris, saved]);
    }
  };
  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>Camera & Upload</H1>
      <Text className="text-gray-600 mt-2 mb-6">Capture the civic issue.</Text>
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1"><Button title="Take photo" onPress={shoot} /></View>
        <View className="flex-1"><Button title="Gallery" variant="secondary" onPress={pick} /></View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {draft.photoUris.map((u) => (
          <Image key={u} source={{ uri: u }} className="w-24 h-24 rounded-xl" />
        ))}
      </View>
      <View className="mt-6"><Button title="Next: Category" onPress={() => router.push('/report/category')} /></View>
      <View className="h-8" />
    </ScrollView>
  );
}
