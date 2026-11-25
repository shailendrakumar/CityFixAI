// CityFixAI shared types (mobile)

export type ReportStatus =
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'resolved_pending_verification'
  | 'resolved'
  | 'duplicate'
  | 'rejected';

export type SeverityLabel = 'low' | 'medium' | 'high' | 'critical';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type SyncOp = 'create' | 'update' | 'delete' | 'upvote' | 'comment' | 'status';

export type UserRole = 'citizen' | 'moderator' | 'admin';

export interface Report {
  id: string; // client local id (uuid)
  serverId: string | null;
  clientRequestId: string | null;
  userId: string | null;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  severityScore: number; // 0-100
  severityLabel: SeverityLabel;
  status: ReportStatus;
  lat: number;
  lng: number;
  address: string | null;
  wardId: string | null;
  photoUris: string[]; // local file paths
  serverPhotoUrls: string[];
  aiCategory: string | null;
  aiSeverity: number | null;
  aiConfidence: number | null;
  aiRationale: string | null;
  aiModelVersion: string | null;
  duplicateOf: string | null;
  upvoteCount: number;
  isDemo: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  serverUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultSeverity: number;
  description: string;
  isDemo: boolean;
}

export interface Ward {
  id: string;
  name: string;
  city: string;
  boundaryGeojson: string | null;
  population: number;
  isDemo: boolean;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string | null;
  authorName: string;
  body: string;
  isDemo: boolean;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: SyncOp;
  payload: string; // JSON
  clientRequestId: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  status: 'queued' | 'in_flight' | 'done' | 'dead';
  lastError: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  wardId: string | null;
  contributionPoints: number;
  isDemo: boolean;
  createdAt: string;
}

export const CATEGORIES_SEED: Category[] = [
  { id: 'pothole', name: 'Pothole', icon: '🕳️', color: '#ef4444', defaultSeverity: 60, description: 'Road surface damage', isDemo: false },
  { id: 'streetlight', name: 'Broken Streetlight', icon: '💡', color: '#f59e0b', defaultSeverity: 40, description: 'Non-functional street lighting', isDemo: false },
  { id: 'water_leak', name: 'Water Leak', icon: '💧', color: '#3b82f6', defaultSeverity: 70, description: 'Pipe leak or water pooling', isDemo: false },
  { id: 'trash', name: 'Trash / Dumping', icon: '🗑️', color: '#84cc16', defaultSeverity: 30, description: 'Illegal dumping or overflow', isDemo: false },
  { id: 'sidewalk', name: 'Sidewalk Damage', icon: '🚶', color: '#a855f7', defaultSeverity: 45, description: 'Broken or obstructed sidewalk', isDemo: false },
  { id: 'graffiti', name: 'Graffiti', icon: '🎨', color: '#ec4899', defaultSeverity: 15, description: 'Vandalism / graffiti', isDemo: false },
  { id: 'traffic_signal', name: 'Traffic Signal', icon: '🚦', color: '#f97316', defaultSeverity: 80, description: 'Malfunctioning signal', isDemo: false },
  { id: 'other', name: 'Other', icon: '📌', color: '#6b7280', defaultSeverity: 30, description: 'Other civic issue', isDemo: false },
];

export interface ReportImage {
  id: string;
  reportId: string;
  localUri: string;
  remoteUrl: string | null;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
  error: string | null;
  createdAt: string;
}
