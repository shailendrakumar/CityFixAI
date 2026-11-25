// src/services/ai.ts
import { apiUrl } from './api';

export interface VisionClassification {
  issue_type: string;
  visible_damage: string[];
  description: string;
  severity: string;
  safety_impact: string;
  category: string;
  confidence: number;
  needs_confirmation: boolean;
  ai_generated: boolean;
  model_version: string;
  disclaimer?: string;
}

export async function classifyImage(uri: string, hint = ''): Promise<VisionClassification> {
  const form = new FormData();
  form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  if (hint) form.append('hint', hint);
  const res = await fetch(apiUrl('/ai/classify-image'), { method: 'POST', body: form });
  if (!res.ok) throw new Error(`AI classify failed: ${res.status}`);
  return res.json();
}
