# Sync Status and Progress Integration Guide

This document explains how to integrate the sync status, sync log, and progress notification components into the main plugin.

## Components

### 1. StatusBarManager
Manages the status bar item and displays real-time sync status.

### 2. SyncLogService
Tracks and stores all sync activity with filtering and search capabilities.

### 3. SyncLogModal
Displays sync logs in a modal with statistics and filtering options.

### 4. ProgressNotificationService
Shows notifications for sync operations with progress updates.

## Integration Example

```typescript
import { Plugin } from 'obsidian';
import { EventBus } from './core/EventBus';
import { StorageManager } from './core/StorageManager';
import { StatusBarManager } from './ui/StatusBarManager';
import { SyncLogService } from './services/SyncLogService';
import { SyncLogModal } from './ui/SyncLogModal';
import { ProgressNotificationService } from './services/ProgressNotificationService';

export default class VaultSyncPlugin extends Plugin {
  private eventBus: EventBus;
  private storage: StorageManager;
  private statusBarManager: StatusBarManager;
  private syncLogService: SyncLogService;
  private progressNotificationService: ProgressNotificationService;

  async onload() {
    // Initialize core services
    this.eventBus = new EventBus();
    this.storage = new StorageManager(this);

    // Initialize sync log service
    this.syncLogService = new SyncLogService(this.eventBus, this.storage);
    await this.syncLogService.initialize();

    // Initialize status bar
    const statusBarItem = this.addStatusBarItem();
    this.statusBarManager = new StatusBarManager(statusBarItem, this.eventBus);
    
    // Set click handler to open sync log
    this.statusBarManager.setClickHandler(() => {
      new SyncLogModal(this.app, this.syncLogService).open();
    });

    // Initialize progress notifications
    this.progressNotificationService = new ProgressNotificationService(
      this.eventBus,
      {
        showSyncStart: true,
        showSyncProgress: true,
        showSyncComplete: true,
        showSyncError: true,
        progressThreshold: 10, // Show progress for 10+ files
        notificationDuration: 5000 // 5 seconds
      }
    );

    // Add command to view sync log
    this.addCommand({
      id: 'view-sync-log',
      name: 'View Sync Log',
      callback: () => {
        new SyncLogModal(this.app, this.syncLogService).open();
      }
    });

    // Add command to clear sync log
    this.addCommand({
      id: 'clear-sync-log',
      name: 'Clear Sync Log',
      callback: async () => {
        if (confirm('Are you sure you want to clear all sync logs?')) {
          await this.syncLogService.clearLogs();
          this.progressNotificationService.showSuccess('Sync log cleared');
        }
      }
    });

    // Add command to export sync log
    this.addCommand({
      id: 'export-sync-log',
      name: 'Export Sync Log',
      callback: () => {
        const logs = this.syncLogService.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vaultsync-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.progressNotificationService.showSuccess('Sync log exported');
      }
    });

    // Add command to view sync statistics
    this.addCommand({
      id: 'view-sync-statistics',
      name: 'View Sync Statistics',
      callback: () => {
        const stats = this.syncLogService.getStatistics();
        const message = [
          'Sync Statistics:',
          `Total Syncs: ${stats.totalSyncs}`,
          `Success Rate: ${stats.totalSyncs > 0 ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100) : 0}%`,
          `Files Uploaded: ${stats.filesUploaded}`,
          `Files Downloaded: ${stats.filesDownloaded}`,
          `Conflicts: ${stats.conflictsDetected}`,
          `Average Duration: ${stats.averageSyncDuration > 0 ? (stats.averageSyncDuration / 1000).toFixed(1) + 's' : 'N/A'}`
        ].join('\n');
        
        this.progressNotificationService.showInfo(message);
      }
    });
  }

  onunload() {
    // Cleanup
    if (this.statusBarManager) {
      this.statusBarManager.destroy();
    }
    
    if (this.progressNotificationService) {
      this.progressNotificationService.clearProgressNotification();
    }
  }
}
```

## Event Flow

### Sync Started
1. User initiates sync (manual or automatic)
2. `SYNC_STARTED` event is emitted
3. StatusBarManager updates to "Syncing" state
4. ProgressNotificationService shows "Starting sync..." notification
5. SyncLogService logs the sync start

### Sync Progress
1. Sync operation processes files
2. `SYNC_PROGRESS` events are emitted with current/total counts
3. StatusBarManager updates with percentage
4. ProgressNotificationService updates progress notification (if threshold met)

### Sync Completed
1. Sync operation finishes
2. `SYNC_COMPLETED` event is emitted with results
3. StatusBarManager updates to "Connected" state with last sync time
4. ProgressNotificationService shows completion notification with statistics
5. SyncLogService logs the completion and updates statistics

### Sync Error
1. Error occurs during sync
2. `SYNC_ERROR` event is emitted
3. StatusBarManager updates to "Error" state
4. ProgressNotificationService shows error notification
5. SyncLogService logs the error

### File Operations
1. Individual file is synced
2. `FILE_SYNCED` event is emitted
3. SyncLogService logs the file operation
4. ProgressNotificationService shows notification (if not in bulk operation)

### Conflicts
1. Conflict is detected
2. `CONFLICT_DETECTED` event is emitted
3. ProgressNotificationService shows conflict notification
4. SyncLogService logs the conflict

## Configuration

### Status Bar
The status bar automatically updates based on events. No configuration needed.

### Sync Log
Configure maximum log entries:
```typescript
this.syncLogService.maxLogEntries = 1000; // Default
```

### Progress Notifications
Configure notification behavior:
```typescript
this.progressNotificationService.updateConfig({
  showSyncStart: true,
  showSyncProgress: true,
  showSyncComplete: true,
  showSyncError: true,
  progressThreshold: 10,
  notificationDuration: 5000
});
```

## Settings Integration

Add settings to control notification behavior:

```typescript
interface PluginSettings {
  // ... other settings
  
  // Notification settings
  notifyOnSync: boolean;
  notifyOnConflict: boolean;
  notifyProgressThreshold: number;
  notificationDuration: number;
}

// In settings tab:
new Setting(containerEl)
  .setName('Sync Notifications')
  .setDesc('Show notifications when files are synced')
  .addToggle(toggle => {
    toggle
      .setValue(this.plugin.settings.notifyOnSync)
      .onChange(async (value) => {
        this.plugin.settings.notifyOnSync = value;
        await this.plugin.saveSettings();
        
        // Update notification service
        this.plugin.progressNotificationService.updateConfig({
          showSyncComplete: value
        });
      });
  });
```

## CSS Styling

Include the CSS file in your plugin:

```typescript
// In main.ts
import './ui/SyncLogModal.css';
```

Or add to styles.css:
```css
@import './ui/SyncLogModal.css';
```

## Testing

### Manual Testing
1. Start a sync operation
2. Verify status bar updates
3. Click status bar to open sync log
4. Verify notifications appear
5. Check sync statistics

### Event Testing
```typescript
// Emit test events
this.eventBus.emit(EVENTS.SYNC_STARTED);
this.eventBus.emit(EVENTS.SYNC_PROGRESS, {
  current: 5,
  total: 10,
  currentFile: 'test.md',
  operation: 'upload'
});
this.eventBus.emit(EVENTS.SYNC_COMPLETED, {
  success: true,
  filesProcessed: 10,
  filesUploaded: 5,
  filesDownloaded: 3,
  filesDeleted: 0,
  errors: [],
  duration: 2500
});
```

## Troubleshooting

### Status bar not updating
- Verify EventBus is properly initialized
- Check that events are being emitted
- Ensure StatusBarManager is created with correct statusBarItem

### Notifications not showing
- Check notification settings
- Verify ProgressNotificationService is initialized
- Check console for errors

### Sync log not persisting
- Verify StorageManager is working
- Check that SyncLogService.initialize() is called
- Check storage permissions

## Best Practices

1. **Initialize in order**: EventBus → Storage → SyncLog → StatusBar → Notifications
2. **Handle errors gracefully**: Always emit error events for proper logging
3. **Debounce frequent events**: Avoid spamming notifications for rapid file changes
4. **Clean up on unload**: Destroy managers and clear notifications
5. **Test with large operations**: Verify progress updates work with many files
6. **Respect user preferences**: Allow disabling notifications in settings
