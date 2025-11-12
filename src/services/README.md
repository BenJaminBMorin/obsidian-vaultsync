# File Sync Service - Basic Operations

This directory contains the implementation of Task 5: File Sync Service - Basic Operations.

## Overview

The file sync service consists of four main components that work together to provide robust file synchronization:

1. **FileWatcherService** - Monitors file system changes
2. **SyncQueueService** - Manages pending sync operations with retry logic
3. **FileSyncService** - Handles actual file upload/download operations
4. **SyncService** - Orchestrates all sync components

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Obsidian Vault                       │
│                    (File Changes)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FileWatcherService                         │
│  - Detects file create/modify/delete/rename             │
│  - Debounces rapid changes                              │
│  - Filters excluded folders                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (emits FILE_SYNCED event)
┌─────────────────────────────────────────────────────────┐
│                 SyncService                             │
│  - Receives file change events                          │
│  - Coordinates sync operations                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SyncQueueService                           │
│  - Queues operations with priority                      │
│  - Implements retry with exponential backoff            │
│  - Persists queue to storage                            │
│  - Processes operations concurrently                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FileSyncService                            │
│  - Uploads files to remote                              │
│  - Downloads files from remote                          │
│  - Computes and tracks file hashes                      │
│  - Maintains sync status and timestamps                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  VaultSync API                          │
│              (Remote Storage)                           │
└─────────────────────────────────────────────────────────┘
```

## Usage Example

```typescript
import { Plugin } from 'obsidian';
import { EventBus } from './core/EventBus';
import { StorageManager } from './core/StorageManager';
import { AuthService } from './services/AuthService';
import { APIClient } from './api/APIClient';
import { SyncService, SyncMode } from './services/SyncService';

export default class VaultSyncPlugin extends Plugin {
  private eventBus: EventBus;
  private storage: StorageManager;
  private authService: AuthService;
  private apiClient: APIClient;
  private syncService: SyncService;

  async onload() {
    // Initialize core services
    this.eventBus = new EventBus();
    this.storage = new StorageManager(this);
    await this.storage.initialize();

    // Initialize auth and API
    this.authService = new AuthService(this.storage, this.eventBus);
    this.apiClient = new APIClient(this.authService, 'http://localhost:3001/v1');

    // Initialize sync service
    this.syncService = new SyncService(
      this.app.vault,
      this.apiClient,
      this.eventBus,
      this.storage,
      {
        mode: SyncMode.SMART_SYNC,
        autoSync: true,
        excludedFolders: ['.obsidian', '.trash'],
        debounceDelay: 1000,
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 30000,
        maxConcurrent: 5
      }
    );

    // Initialize with vault ID
    const vaultId = 'your-vault-id';
    await this.syncService.initialize(vaultId);

    // Register file event handlers
    this.registerFileEvents();

    // Start sync service
    await this.syncService.start();

    // Add commands
    this.addCommand({
      id: 'sync-all',
      name: 'Sync All Files',
      callback: async () => {
        const result = await this.syncService.syncAll();
        console.log('Sync result:', result);
      }
    });
  }

  registerFileEvents() {
    // File created
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile) {
          this.syncService.fileWatcher.handleCreate(file);
        }
      })
    );

    // File modified
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          this.syncService.fileWatcher.handleModify(file);
        }
      })
    );

    // File deleted
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) {
          this.syncService.fileWatcher.handleDelete(file);
        }
      })
    );

    // File renamed
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (file instanceof TFile) {
          this.syncService.fileWatcher.handleRename(file, oldPath);
        }
      })
    );
  }

  onunload() {
    // Stop sync service
    this.syncService.stop();
  }
}
```

## Component Details

### FileWatcherService

**Purpose**: Monitor file system changes and emit events for sync processing.

**Key Features**:
- Detects file create, modify, delete, and rename events
- Debounces rapid changes (default 1 second)
- Filters files based on excluded folders
- Emits FILE_SYNCED events to EventBus

**Configuration**:
```typescript
{
  excludedFolders: ['.obsidian', '.trash'],
  debounceDelay: 1000 // milliseconds
}
```

### SyncQueueService

**Purpose**: Manage pending sync operations with retry logic and persistence.

**Key Features**:
- Queues operations with priority
- Implements exponential backoff retry (max 3 attempts by default)
- Persists queue to local storage
- Processes operations concurrently (max 5 by default)
- Tracks operation status (pending, processing, failed)

**Configuration**:
```typescript
{
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
  maxConcurrent: 5
}
```

**Queue Operations**:
- `enqueue()` - Add operation to queue
- `dequeue()` - Remove operation from queue
- `getQueue()` - Get all queued operations
- `clearFailed()` - Clear failed operations
- `retryFailed()` - Retry all failed operations

### FileSyncService

**Purpose**: Handle actual file upload/download operations with hash tracking.

**Key Features**:
- Uploads files to remote vault
- Downloads files from remote vault
- Deletes files from remote vault
- Computes SHA-256 hashes for change detection
- Tracks sync status and timestamps
- Persists sync state to storage

**Methods**:
- `uploadFile(file)` - Upload file to remote
- `downloadFile(path)` - Download file from remote
- `deleteFile(path)` - Delete file from remote
- `hasLocalChanges(file)` - Check if file changed locally
- `hasRemoteChanges(path)` - Check if file changed remotely
- `getSyncStatus(path)` - Get sync status for file

### SyncService

**Purpose**: Orchestrate all sync components and provide high-level sync operations.

**Key Features**:
- Coordinates FileWatcher, SyncQueue, and FileSync
- Handles file change events
- Processes queued operations
- Provides manual sync operations
- Emits sync events (started, progress, completed, error)

**Methods**:
- `start()` - Start sync service
- `stop()` - Stop sync service
- `syncAll()` - Manually sync all files
- `updateConfig()` - Update sync configuration
- `getSyncStatistics()` - Get sync statistics

## Events

The sync service emits the following events through EventBus:

- `SYNC_STARTED` - Sync operation started
- `SYNC_PROGRESS` - Sync progress update
- `SYNC_COMPLETED` - Sync operation completed
- `SYNC_ERROR` - Sync error occurred
- `FILE_SYNCED` - Individual file synced
- `QUEUE_UPDATED` - Queue state changed

## Storage

The sync service persists the following data:

- `lastSyncTimestamps` - Map of file paths to last sync timestamps
- `fileHashes` - Map of file paths to SHA-256 hashes
- `syncQueue` - Array of queued operations

## Error Handling

The sync service implements robust error handling:

1. **Network Errors**: Retry with exponential backoff (up to 3 times)
2. **File Not Found**: Skip and continue with other files
3. **Authentication Errors**: Emit error event for user action
4. **Queue Persistence Errors**: Log error but continue operation

## Performance Considerations

- **Debouncing**: Prevents excessive sync operations during rapid file changes
- **Batching**: Processes multiple operations concurrently (max 5)
- **Hash Comparison**: Avoids unnecessary uploads when content hasn't changed
- **Queue Persistence**: Ensures no data loss on plugin restart

## Testing

To test the sync service:

1. Create/modify/delete files in Obsidian
2. Check console logs for sync operations
3. Verify files are synced to remote vault
4. Test offline mode by disconnecting network
5. Verify queue persists and processes on reconnection

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 6.1**: File change detection and sync
- **Requirement 10.3**: Excluded folder filtering
- **Requirement 10.4**: Selective sync
- **Requirement 11.2**: Operation queueing
- **Requirement 11.3**: Retry logic with exponential backoff
- **Requirement 13.3**: Hash-based change detection
- **Requirement 13.4**: Sync status tracking
- **Requirement 14.1**: Error handling with retry
- **Requirement 14.2**: Concurrent operation processing

## Next Steps

After implementing this task, the next tasks to implement are:

- **Task 6**: Sync Modes Implementation (Smart Sync, Pull All, Push All, Manual)
- **Task 7**: Conflict Resolution
- **Task 8**: WebSocket Manager for real-time sync
