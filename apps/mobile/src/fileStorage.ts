// src/fileStorage.ts
import * as FileSystem from 'expo-file-system/legacy';
import { uuid } from './utils/uuid';

const PHOTO_DIR = `${FileSystem.documentDirectory}cityfix/photos/`;
const TEMP_DIR = `${FileSystem.documentDirectory}cityfix/.tmp/`;

export async function ensurePhotoDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  const t = await FileSystem.getInfoAsync(TEMP_DIR);
  if (!t.exists) await FileSystem.makeDirectoryAsync(TEMP_DIR, { intermediates: true });
}

export async function cleanupTempFiles(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(TEMP_DIR);
    if (info.exists) await FileSystem.deleteAsync(TEMP_DIR, { idempotent: true });
    await FileSystem.makeDirectoryAsync(TEMP_DIR, { intermediates: true });
  } catch {}
}

export async function savePhoto(uri: string): Promise<string> {
  await ensurePhotoDir();
  const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = `${PHOTO_DIR}${uuid()}.${ext}`;
  const temp = `${TEMP_DIR}${uuid()}.${ext}`;
  // Copy to temp first to handle interrupted uploads gracefully.
  await FileSystem.copyAsync({ from: uri, to: temp });
  const info = await FileSystem.getInfoAsync(temp);
  if (!info.exists) throw new Error('Failed to copy photo to temp storage');
  await FileSystem.moveAsync({ from: temp, to: dest });
  return dest;
}

export async function deletePhoto(uri: string): Promise<void> {
  try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
}

export async function photoExists(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
}

export async function cleanupOrphanedPhotos(validUris: string[]): Promise<number> {
  await ensurePhotoDir();
  const dir = await FileSystem.readDirectoryAsync(PHOTO_DIR);
  const valid = new Set(validUris.map((u) => u.split('/').pop()));
  let removed = 0;
  for (const name of dir) {
    if (!valid.has(name)) {
      try { await FileSystem.deleteAsync(`${PHOTO_DIR}${name}`, { idempotent: true }); removed++; } catch {}
    }
  }
  return removed;
}

export async function getPhotoSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return (info as any)?.size ?? 0;
}