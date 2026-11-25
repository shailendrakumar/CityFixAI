// src/migrations.ts
import type * as SQLite from 'expo-sqlite';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

async function safeAlter(db: SQLite.SQLiteDatabase, sql: string): Promise<void> {
  try {
    await db.execAsync(sql);
  } catch (e: any) {
    if (!String(e?.message ?? e).toLowerCase().includes('duplicate column')) {
      throw e;
    }
  }
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          server_id TEXT,
          client_request_id TEXT,
          user_id TEXT,
          title TEXT NOT NULL,
                                                                        subcategory TEXT,
          severity_score INTEGER DEFAULT 0,
          severity_label TEXT DEFAULT 'low',
          status TEXT DEFAULT 'open',
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          address TEXT,
          ward_id TEXT,
          photo_uris TEXT DEFAULT '[]',
          server_photo_urls TEXT DEFAULT '[]',
          ai_category TEXT,
          ai_severity INTEGER,
          ai_confidence REAL,
          ai_rationale TEXT,
          ai_model_version TEXT,
          duplicate_of TEXT,
          upvote_count INTEGER DEFAULT 0,
          is_demo INTEGER DEFAULT 0,
          sync_status TEXT DEFAULT 'pending',
          sync_error TEXT,
          server_updated_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          resolved_at TEXT
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload TEXT NOT NULL,
          client_request_id TEXT UNIQUE NOT NULL,
          attempts INTEGER DEFAULT 0,
          max_attempts INTEGER DEFAULT 8,
          next_retry_at TEXT,
          status TEXT DEFAULT 'queued',
          last_error TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          default_severity INTEGER DEFAULT 30,
          description TEXT,
          is_demo INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS wards (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          city TEXT,
          boundary_geojson TEXT,
          population INTEGER DEFAULT 0,
          is_demo INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          report_id TEXT NOT NULL,
          user_id TEXT,
          author_name TEXT,
          body TEXT NOT NULL,
          is_demo INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT,
          display_name TEXT,
          role TEXT DEFAULT 'citizen',
          ward_id TEXT,
          is_demo INTEGER DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS report_images (
          id TEXT PRIMARY KEY,
          report_id TEXT NOT NULL,
          local_uri TEXT NOT NULL,
          remote_url TEXT,
          upload_status TEXT DEFAULT 'pending',
          error TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_reports_ward ON reports(ward_id);
        CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
        CREATE INDEX IF NOT EXISTS idx_reports_sync ON reports(sync_status);
        CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
        CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status);
        CREATE INDEX IF NOT EXISTS idx_sync_entity ON sync_queue(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_comments_report ON comments(report_id);
        CREATE INDEX IF NOT EXISTS idx_images_report ON report_images(report_id);
      `);
      await db.runAsync('INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)', ['schema_version', '1']);
    },
  },
  {
    version: 2,
    name: 'add_conflict_columns',
    up: async (db) => {
      await safeAlter(db, 'ALTER TABLE reports ADD COLUMN client_request_id TEXT');
      await safeAlter(db, 'ALTER TABLE reports ADD COLUMN server_updated_at TEXT');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_reports_client_req ON reports(client_request_id)');
    },
  },
];

export async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)`);
  const row: any = await db.getFirstAsync('SELECT MAX(version) as v FROM schema_migrations');
  return row?.v ?? 0;
}

export async function applyMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)`);
  const current = await getCurrentVersion(db);
  const pending = MIGRATIONS.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)', [
        migration.version,
        migration.name,
        new Date().toISOString(),
      ]);
    });
  }
  const latest = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), 0);
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', ['schema_version', String(latest)]);
}
