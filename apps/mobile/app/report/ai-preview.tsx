import { View, Text, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Card, H1 } from '../../src/components/ui';
import { useReportDraft } from '../../src/stores/reportDraftStore';
import { insertReport } from '../../src/db/repos/reports';
import { enqueue } from '../../src/db/repos/syncQueue';
import { uuid } from '../../src/utils/uuid';
import { useQueryClient } from '@tanstack/react-query';
import { classifyImage, VisionClassification } from '../../src/services/ai';

export default function AIPreviewScreen() {
  const router = useRouter();
  const draft = useReportDraft();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<VisionClassification | null>(null);

  const analyze = async () => {
    if (!draft.photoUris.length) return;
    setAnalyzing(true);
    try {
      const r = await classifyImage(draft.photoUris[0]);
      setAiResult(r);
      if (!draft.title) draft.setTitle(r.issue_type);
      if (!draft.description) draft.setDescription(r.description);
    } catch (e) {
      setAiResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    if (draft.lat == null || draft.lng == null) return;
    setSaving(true);
    try {
      const clientRequestId = uuid();
      const report = await insertReport({
        title: draft.title || 'Untitled issue',
        description: draft.description,
        category: draft.category,
        lat: draft.lat,
        lng: draft.lng,
        address: draft.address,
        wardId: draft.wardId,
        photoUris: draft.photoUris,
      });
      await enqueue({
        entityType: 'report',
        entityId: report.id,
        operation: 'create',
        payload: JSON.stringify({
          title: report.title,
          description: report.description,
          category: report.category,
          lat: report.lat,
          lng: report.lng,
          address: report.address,
          ward_id: report.wardId,
          photo_urls: report.photoUris,
          anonymous: draft.anonymous,
        }),
        clientRequestId,
      });
      draft.reset();
      await qc.invalidateQueries({ queryKey: ['myreports'] });
      router.replace('/(tabs)/my-reports');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
      <H1>AI Analysis Preview</H1>
      <Text className="text-gray-600 mt-2 mb-6">Review before submitting.</Text>
      <Card>
        <Text className="text-sm text-gray-500">Title</Text>
        <TextInput className="text-forest-900 font-semibold mt-1" value={draft.title} onChangeText={draft.setTitle} placeholder="Issue title" />
      </Card>
      <Card className="mt-3">
        <Text className="text-sm text-gray-500">Description</Text>
        <TextInput className="text-gray-700 mt-1" value={draft.description} onChangeText={draft.setDescription} placeholder="Describe the issue" multiline />
      </Card>
      <Card className="mt-3">
        <Text className="text-sm text-gray-500">Category</Text>
        <Text className="text-forest-800 font-semibold mt-1">{draft.category}</Text>
        <Text className="text-xs text-gray-500 mt-2">AI will classify, deduplicate and score severity on sync.</Text>
      </Card>
      {draft.lat == null && (
        <Text className="text-amber-600 text-sm mt-3">Location not set. Go back to Location step.</Text>
      )}
      {draft.photoUris.length > 0 && (
        <View className="mt-4">
          {analyzing ? <ActivityIndicator /> : <Button title="Analyze photo with AI" variant="secondary" onPress={analyze} />}
        </View>
      )}
      {aiResult && (
        <Card className="mt-3">
          <Text className="font-semibold text-forest-800">AI suggestion (AI-generated)</Text>
          <Text className="text-gray-700 mt-1">{aiResult.issue_type} · {aiResult.category}</Text>
          <Text className="text-gray-600 text-sm mt-1">{aiResult.description}</Text>
          <Text className="text-gray-600 text-sm mt-1">Severity: {aiResult.severity} · Safety: {aiResult.safety_impact} · Confidence: {aiResult.confidence.toFixed(2)}</Text>
          {aiResult.needs_confirmation && <Text className="text-amber-600 text-sm mt-1">Low confidence — please confirm.</Text>}
          <Text className="text-xs text-gray-400 mt-2 italic">{aiResult.disclaimer}</Text>
        </Card>
      )}
      <View className="mt-6">
        {saving ? <ActivityIndicator /> : <Button title="Submit report" onPress={submit} />}
      </View>
      <View className="h-8" />
    </ScrollView>
  );
}
