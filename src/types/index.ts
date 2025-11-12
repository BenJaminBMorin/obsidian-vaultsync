// Core Types for VaultSync Plugin

// Export initial sync types
export * from './initial-sync.types';

export interface PluginSettings {
  // Authentication
  apiKey: string | null;
  apiKeyExpires: Date | null;
  
  // Vault selection
  selectedVaultId: string | null;
  
  // Sync settings
  syncMode: SyncMode;
  autoSync: boolean;
  syncInterval: number; // seconds
  
  // Selective sync
  includedFolders: string[];
  excludedFolders: string[];
  
  // Collaboration
  collaborationEnabled: boolean;
  showPresence: boolean;
  showCursors: boolean;
  showTypingIndicators: boolean;
  
  // Notifications
  notifyOnSync: boolean;
  notifyOnConflict: boolean;
  notifyOnCollaboratorJoin: boolean;
  
  // Performance
  maxConcurrentUploads: number;
  chunkSize: number; // bytes
  cacheEnabled: boolean;
  
  // Advanced
  apiBaseURL: string;
  wsBaseURL: string;
  deviceId: string;
  debugMode: boolean;
}

export enum SyncMode {
  SMART_SYNC = 'smart_sync',
  PULL_ALL = 'pull_all',
  PUSH_ALL = 'push_all',
  MANUAL = 'manual'
}

export interface VaultInfo {
  vault_id: string;
  name: string;
  file_count: number;
  total_size_bytes: number;
  created_at: Date;
  updated_at: Date;
  is_cross_tenant?: boolean;
  permission?: 'read' | 'write' | 'admin';
  owner_tenant_id?: string;
}

export interface FileInfo {
  file_id: string;
  vault_id: string;
  path: string;
  size_bytes: number;
  hash: string;
  created_at: Date;
  updated_at: Date;
  last_editor?: {
    user_id: string;
    user_name: string;
  };
}

export interface FileContent {
  file_id: string;
  path: string;
  content: string;
  hash: string;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  success: boolean;
  filesProcessed: number;
  filesUpdated: number;
  filesCreated: number;
  filesDeleted: number;
  conflicts: ConflictInfo[];
  errors: SyncError[];
  duration: number;
}

export interface SyncProgress {
  current: number;
  total: number;
  currentFile: string;
  operation: 'upload' | 'download' | 'check';
}

export interface SyncError {
  file: string;
  error: string;
  recoverable: boolean;
}

export interface ConflictInfo {
  id: string;
  path: string;
  localContent: string;
  remoteContent: string;
  localModified: Date;
  remoteModified: Date;
  conflictType: ConflictType;
  autoResolvable: boolean;
}

export enum ConflictType {
  CONTENT = 'content',
  DELETION = 'deletion',
  RENAME = 'rename'
}

export enum ResolutionStrategy {
  KEEP_LOCAL = 'keep_local',
  KEEP_REMOTE = 'keep_remote',
  KEEP_BOTH = 'keep_both',
  MERGE_MANUAL = 'merge_manual'
}

export interface ConflictResolution {
  strategy: ResolutionStrategy;
  mergedContent?: string;
}

export interface ActiveUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'active' | 'away';
  currentFile: string | null;
  lastActivity: Date;
}

export interface PresenceState {
  userId: string;
  vaultId: string;
  status: 'active' | 'away' | 'offline';
  currentFile: string | null;
  lastActivity: Date;
}

export interface AwarenessState {
  user: {
    id: string;
    name: string;
    avatar?: string;
    color: string;
  };
  cursor?: {
    line: number;
    ch: number;
  };
  selection?: {
    from: { line: number; ch: number };
    to: { line: number; ch: number };
  };
  isTyping: boolean;
}

export interface QueuedFile {
  path: string;
  operation: 'create' | 'update' | 'delete';
  content?: string;
  timestamp: Date;
  retries: number;
}

export interface LocalStorage {
  // Sync state
  lastSyncTimestamp: Record<string, Date>; // filePath -> timestamp
  fileHashes: Record<string, string>; // filePath -> hash
  syncQueue: QueuedFile[];
  
  // Conflicts
  conflicts: ConflictInfo[];
  
  // Presence cache
  activeUsers: Record<string, ActiveUser>; // userId -> user
  fileViewers: Record<string, string[]>; // filePath -> userIds
  
  // Collaboration state
  yjsDocuments: Record<string, Uint8Array>; // filePath -> Y.Doc state
  
  // Metadata cache
  vaultCache: VaultInfo | null;
  filesCache: Record<string, FileInfo>; // fileId -> fileInfo
}
