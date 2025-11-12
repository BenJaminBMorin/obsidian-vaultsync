# Sync Modes Documentation

This document describes the different sync modes available in the VaultSync plugin and how they work.

## Overview

The VaultSync plugin supports four sync modes:

1. **Smart Sync** - Bidirectional sync with automatic conflict detection
2. **Pull All** - Download all remote files, preserving local changes as conflict copies
3. **Push All** - Upload all local files, overwriting remote versions
4. **Manual** - Disable automatic sync, require manual commands

## Smart Sync Mode

**Default Mode** - Recommended for most users

### How It Works

Smart Sync performs bidirectional synchronization with intelligent conflict detection:

1. **Local Changes Only**: If a file has changed locally but not remotely, it uploads the local version
2. **Remote Changes Only**: If a file has changed remotely but not locally, it downloads the remote version
3. **Both Changed**: If a file has changed both locally and remotely, it detects a conflict and queues it for manual resolution
4. **New Files**: New files are automatically synced in the appropriate direction

### Features

- ✅ Automatic bidirectional sync
- ✅ Conflict detection before sync
- ✅ Three-way merge for compatible changes
- ✅ Queues conflicts for manual resolution
- ✅ Preserves both versions during conflicts

### When to Use

- Working on multiple devices
- Collaborating with others
- Want automatic sync with safety

### Auto-Sync Behavior

When auto-sync is enabled in Smart Sync mode:
- File changes are automatically detected and synced
- Conflicts are detected before uploading
- You'll be notified of any conflicts

## Pull All Mode

**One-Way Sync: Remote → Local**

### How It Works

Pull All downloads all remote files and handles local differences:

1. **Remote File Exists Locally**: 
   - If content differs, creates a conflict copy with timestamp
   - Downloads the remote version
2. **Remote File Doesn't Exist Locally**:
   - Downloads the file

### Features

- ✅ Downloads all remote files
- ✅ Creates conflict copies for local differences
- ✅ Preserves local work
- ✅ Shows progress and completion notice

### When to Use

- Setting up a new device
- Want to ensure you have all remote content
- Recovering from sync issues
- Prefer remote version as source of truth

### Conflict Copy Format

Conflict copies are created with the format:
```
original-file.conflict-2024-10-26T10-30-45.md
```

## Push All Mode

**One-Way Sync: Local → Remote**

### How It Works

Push All uploads all local files and overwrites remote versions:

1. **Local File Exists Remotely**:
   - Overwrites the remote version
2. **Local File Doesn't Exist Remotely**:
   - Creates a new remote file

### Features

- ✅ Uploads all local files
- ✅ Overwrites remote versions
- ✅ Shows progress and completion notice
- ✅ Handles large files with chunking
- ✅ Confirmation prompt for safety

### When to Use

- Want to make local version authoritative
- Recovering from remote corruption
- Initial vault setup
- Prefer local version as source of truth

### Safety

Push All requires confirmation before proceeding to prevent accidental overwrites.

## Manual Mode

**No Automatic Sync**

### How It Works

Manual mode disables all automatic synchronization:

- File changes are detected but not synced
- You must manually trigger sync operations
- Provides full control over when sync happens

### Features

- ✅ No automatic sync
- ✅ Manual sync commands available
- ✅ Full control over sync timing
- ✅ Force Sync command available

### When to Use

- Want complete control over sync
- Working offline frequently
- Testing or debugging
- Prefer explicit sync operations

### Available Commands

In Manual mode, use these commands:

- **Smart Sync**: Perform bidirectional sync with conflict detection
- **Pull All**: Download all remote files
- **Push All**: Upload all local files
- **Force Sync**: Clear sync state and perform full sync

## Force Sync Command

Available in all modes, Force Sync:

1. Clears all sync state (hashes, timestamps)
2. Performs a full sync based on current mode
3. Useful for recovering from sync issues

## Conflict Resolution

When conflicts are detected (in Smart Sync mode):

1. Both versions are preserved
2. A conflict record is created
3. You're notified of the conflict
4. Use the "View Conflicts" command to resolve

### Resolution Options

- **Keep Local**: Upload local version
- **Keep Remote**: Download remote version
- **Keep Both**: Keep local file and create copy with remote content
- **Merge Manually**: Open both versions for manual editing

## Best Practices

### For Solo Use

- Use **Smart Sync** with auto-sync enabled
- Conflicts are rare when working alone
- Automatic sync keeps devices in sync

### For Collaboration

- Use **Smart Sync** with auto-sync enabled
- Be aware of conflicts when editing same files
- Communicate with collaborators about active work
- Use presence indicators to see who's editing what

### For Offline Work

- Use **Manual** mode when working offline
- Sync manually when back online
- Smart Sync will detect conflicts from offline period

### For Recovery

- Use **Pull All** to get all remote content
- Use **Push All** to make local version authoritative
- Use **Force Sync** to clear sync state and start fresh

## Sync State

The plugin maintains sync state for each file:

- **Last Sync Timestamp**: When file was last synced
- **File Hash**: SHA-256 hash of file content
- **Sync Status**: synced, syncing, pending, error, conflict

This state is used to detect changes and conflicts efficiently.

## Performance

### Smart Sync

- Only syncs changed files
- Uses hash comparison for change detection
- Efficient for large vaults

### Pull All / Push All

- Processes all files
- May take longer for large vaults
- Shows progress indicator

### Optimization

- Files are processed in batches
- Large files use chunking
- Concurrent operations are limited (default: 5)

## Troubleshooting

### Sync Not Working

1. Check connection status
2. Verify vault is selected
3. Check sync mode and auto-sync settings
4. Try Force Sync

### Conflicts Not Resolving

1. Use "View Conflicts" command
2. Manually resolve each conflict
3. Check conflict resolution was successful

### Files Not Syncing

1. Check excluded folders settings
2. Verify file is not in excluded path
3. Check for errors in sync log

### Performance Issues

1. Reduce max concurrent uploads
2. Increase sync interval
3. Use selective sync to exclude large folders
4. Enable caching

## Configuration

Sync mode can be configured in plugin settings:

```typescript
{
  syncMode: 'smart_sync' | 'pull_all' | 'push_all' | 'manual',
  autoSync: boolean,
  syncInterval: number, // seconds
  excludedFolders: string[],
  maxConcurrentUploads: number
}
```

## API

### SyncService Methods

```typescript
// Set sync mode
setSyncMode(mode: SyncMode): void

// Perform sync operations
smartSync(): Promise<SyncResult>
pullAll(): Promise<SyncResult>
pushAll(options?: { confirmOverwrite?: boolean }): Promise<SyncResult>
forceSync(): Promise<SyncResult>

// Auto-sync control
enableAutoSync(): void
disableAutoSync(): void
isAutoSyncEnabled(): boolean

// Get current mode
getSyncMode(): SyncMode
```

### Events

```typescript
// Listen for sync events
eventBus.on(EVENTS.SYNC_STARTED, () => {})
eventBus.on(EVENTS.SYNC_PROGRESS, (progress) => {})
eventBus.on(EVENTS.SYNC_COMPLETED, (result) => {})
eventBus.on(EVENTS.SYNC_ERROR, (error) => {})
eventBus.on(EVENTS.SYNC_MODE_CHANGED, ({ oldMode, newMode }) => {})
eventBus.on(EVENTS.CONFLICT_DETECTED, (conflict) => {})
```

## Future Enhancements

Planned improvements:

- Automatic conflict resolution for simple cases
- Merge suggestions using AI
- Scheduled sync operations
- Bandwidth throttling
- Selective file sync (not just folders)
- Sync profiles for different scenarios
