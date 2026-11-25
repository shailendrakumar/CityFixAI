/// <reference types="jest" />
// src/__tests__/offlineFirst.test.ts
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => ({
    execAsync: async () => {},
    runAsync: async () => ({ changes: 1 }),
    getFirstAsync: async () => null,
    getAllAsync: async () => [],
    withTransactionAsync: async (fn: any) => fn(),
  }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: async () => ({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
  addEventListener: () => () => {},
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///tmp/',
  getInfoAsync: async () => ({ exists: false }),
  makeDirectoryAsync: async () => {},
  copyAsync: async () => {},
  moveAsync: async () => {},
  deleteAsync: async () => {},
  readDirectoryAsync: async () => [],
}));

import { uuid } from '../utils/uuid';
import { shouldApplyServerUpdate } from '../reportRepository';
import * as fileStorage from '../fileStorage';

describe('offline-first primitives', () => {
  it('generates unique UUIDs for reports', () => {
    const a = uuid();
    const b = uuid();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('applies server updates when server is newer', () => {
    const local: any = { serverUpdatedAt: '2024-01-01T00:00:00.000Z' };
    expect(shouldApplyServerUpdate(local, '2024-01-02T00:00:00.000Z')).toBe(true);
  });

  it('preserves local data when server is older', () => {
    const local: any = { serverUpdatedAt: '2024-01-02T00:00:00.000Z' };
    expect(shouldApplyServerUpdate(local, '2024-01-01T00:00:00.000Z')).toBe(false);
  });

  it('handles interrupted uploads by using temp storage (savePhoto resolves)', async () => {
    // Mock file info exists after copy
    const fs = require('expo-file-system/legacy');
    fs.getInfoAsync = async () => ({ exists: true });
    const uri = await fileStorage.savePhoto('file:///tmp/photo.jpg');
    expect(uri).toContain('cityfix/photos/');
  });
});