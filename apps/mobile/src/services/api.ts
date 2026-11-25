// src/services/api.ts
const BASE = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:8000';

export function apiUrl(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}
