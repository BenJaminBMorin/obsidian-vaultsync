import { Notice } from 'obsidian';
import { EventBus, EVENTS } from '../core/EventBus';
import { SyncResult } from './SyncService';

/**
 * Progress notification configuration
 */
export interface ProgressNotificationConfig {
  showSyncStart: boolean;
  showSyncProgress: boolean;
  showSyncComplete: boolean;
  showSyncError: boolean;
  progressThreshold: number; // Show progress only if more than N files
  notificationDuration: number; // Duration in milliseconds
}

/**
 * Progress notification service
 * Manages notifications for sync operations
 */
export class ProgressNotificationService {
  private eventBus: EventBus;
  private config: ProgressNotificationConfig;
  private currentNotice: Notice | null = null;
  private syncStartTime: number | null = null;
  private isLongOperation: boolean = false;

  constructor(eventBus: EventBus, config: ProgressNotificationConfig) {
    this.eventBus = eventBus;
    this.config = config;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Sync started
    this.eventBus.on(EVENTS.SYNC_STARTED, () => {
      this.handleSyncStarted();
    });

    // Sync progress
    this.eventBus.on(EVENTS.SYNC_PROGRESS, (progress: any) => {
      this.handleSyncProgress(progress);
    });

    // Sync completed
    this.eventBus.on(EVENTS.SYNC_COMPLETED, (result: SyncResult) => {
      this.handleSyncCompleted(result);
    });

    // Sync error
    this.eventBus.on(EVENTS.SYNC_ERROR, (error: any) => {
      this.handleSyncError(error);
    });

    // File synced (individual file operations)
    this.eventBus.on(EVENTS.FILE_SYNCED, (data: any) => {
      this.handleFileSynced(data);
    });

    // Conflict detected
    this.eventBus.on(EVENTS.CONFLICT_DETECTED, (data: any) => {
      this.handleConflictDetected(data);
    });

    // Connection events
    this.eventBus.on(EVENTS.CONNECTION_CHANGED, (connected: boolean) => {
      this.handleConnectionChanged(connected);
    });

    this.eventBus.on(EVENTS.CONNECTION_ERROR, (error: any) => {
      this.handleConnectionError(error);
    });
  }

  /**
   * Handle sync started
   */
  private handleSyncStarted(): void {
    if (!this.config.showSyncStart) {
      return;
    }

    this.syncStartTime = Date.now();
    this.isLongOperation = false;

    // Show initial notification
    this.showNotification('🔄 Starting sync...', 2000);
  }

  /**
   * Handle sync progress
   */
  private handleSyncProgress(progress: any): void {
    if (!this.config.showSyncProgress) {
      return;
    }

    const { current, total, currentFile, operation } = progress;

    // Only show progress for operations with many files
    if (total < this.config.progressThreshold) {
      return;
    }

    this.isLongOperation = true;

    // Calculate percentage
    const percent = Math.round((current / total) * 100);

    // Format operation
    const operationText = this.formatOperation(operation);

    // Update or create progress notification
    const message = `🔄 Syncing: ${percent}% (${current}/${total})\n${operationText}: ${this.truncateFilePath(currentFile)}`;
    
    if (this.currentNotice) {
      this.currentNotice.setMessage(message);
    } else {
      this.currentNotice = new Notice(message, 0); // 0 = don't auto-hide
    }
  }

  /**
   * Handle sync completed
   */
  private handleSyncCompleted(result: SyncResult): void {
    // Hide progress notification
    if (this.currentNotice) {
      this.currentNotice.hide();
      this.currentNotice = null;
    }

    if (!this.config.showSyncComplete) {
      return;
    }

    // Calculate duration
    const duration = this.syncStartTime
      ? Math.round((Date.now() - this.syncStartTime) / 1000)
      : 0;

    // Build message
    const parts: string[] = ['✅ Sync completed'];

    if (result.filesUploaded > 0) {
      parts.push(`↑ ${result.filesUploaded} uploaded`);
    }

    if (result.filesDownloaded > 0) {
      parts.push(`↓ ${result.filesDownloaded} downloaded`);
    }

    if (result.filesDeleted > 0) {
      parts.push(`🗑️ ${result.filesDeleted} deleted`);
    }

    if (result.errors && result.errors.length > 0) {
      parts.push(`⚠️ ${result.errors.length} errors`);
    }

    if (duration > 0) {
      parts.push(`⏱️ ${duration}s`);
    }

    const message = parts.join(' • ');

    // Show notification
    const notificationDuration = this.isLongOperation
      ? this.config.notificationDuration * 2
      : this.config.notificationDuration;

    this.showNotification(message, notificationDuration);

    // Reset state
    this.syncStartTime = null;
    this.isLongOperation = false;
  }

  /**
   * Handle sync error
   */
  private handleSyncError(error: any): void {
    // Hide progress notification
    if (this.currentNotice) {
      this.currentNotice.hide();
      this.currentNotice = null;
    }

    if (!this.config.showSyncError) {
      return;
    }

    const errorMessage = error.message || error.error || 'Unknown error';
    const filePath = error.path;

    let message = `❌ Sync error: ${errorMessage}`;
    if (filePath) {
      message += `\nFile: ${this.truncateFilePath(filePath)}`;
    }

    this.showNotification(message, this.config.notificationDuration * 2);

    // Reset state
    this.syncStartTime = null;
    this.isLongOperation = false;
  }

  /**
   * Handle file synced
   */
  private handleFileSynced(data: any): void {
    // Only show notifications for individual file operations if not in a bulk sync
    if (this.isLongOperation || !this.config.showSyncComplete) {
      return;
    }

    const { path, action } = data;
    
    let icon = '📄';
    let actionText = 'synced';

    switch (action) {
      case 'upload':
      case 'create':
      case 'update':
        icon = '⬆️';
        actionText = 'uploaded';
        break;
      case 'download':
        icon = '⬇️';
        actionText = 'downloaded';
        break;
      case 'delete':
        icon = '🗑️';
        actionText = 'deleted';
        break;
    }

    const message = `${icon} File ${actionText}: ${this.truncateFilePath(path)}`;
    this.showNotification(message, 3000);
  }

  /**
   * Handle conflict detected
   */
  private handleConflictDetected(data: any): void {
    const { path, conflictId } = data;
    const message = `⚠️ Conflict detected: ${this.truncateFilePath(path)}\nClick "View Conflicts" to resolve`;
    this.showNotification(message, this.config.notificationDuration * 2);
  }

  /**
   * Handle connection changed
   */
  private handleConnectionChanged(connected: boolean): void {
    if (connected) {
      this.showNotification('🟢 Connected to VaultSync', 3000);
    } else {
      this.showNotification('⚫ Disconnected from VaultSync', 3000);
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: any): void {
    const message = `🔴 Connection error: ${error.message || 'Unknown error'}`;
    this.showNotification(message, this.config.notificationDuration * 2);
  }

  /**
   * Show notification
   */
  private showNotification(message: string, duration: number): void {
    new Notice(message, duration);
  }

  /**
   * Format operation type
   */
  private formatOperation(operation: string): string {
    switch (operation) {
      case 'upload':
        return 'Uploading';
      case 'download':
        return 'Downloading';
      case 'check':
        return 'Checking';
      default:
        return 'Processing';
    }
  }

  /**
   * Truncate file path for display
   */
  private truncateFilePath(path: string, maxLength: number = 50): string {
    if (path.length <= maxLength) {
      return path;
    }

    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    
    if (fileName.length >= maxLength - 3) {
      return '...' + fileName.slice(-(maxLength - 3));
    }

    let truncated = fileName;
    let i = parts.length - 2;
    
    while (i >= 0 && truncated.length + parts[i].length + 4 <= maxLength) {
      truncated = parts[i] + '/' + truncated;
      i--;
    }

    if (i >= 0) {
      truncated = '.../' + truncated;
    }

    return truncated;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ProgressNotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): ProgressNotificationConfig {
    return { ...this.config };
  }

  /**
   * Show custom notification
   */
  showCustomNotification(message: string, duration?: number): void {
    this.showNotification(message, duration || this.config.notificationDuration);
  }

  /**
   * Show success notification
   */
  showSuccess(message: string): void {
    this.showNotification(`✅ ${message}`, this.config.notificationDuration);
  }

  /**
   * Show error notification
   */
  showError(message: string): void {
    this.showNotification(`❌ ${message}`, this.config.notificationDuration * 2);
  }

  /**
   * Show warning notification
   */
  showWarning(message: string): void {
    this.showNotification(`⚠️ ${message}`, this.config.notificationDuration * 1.5);
  }

  /**
   * Show info notification
   */
  showInfo(message: string): void {
    this.showNotification(`ℹ️ ${message}`, this.config.notificationDuration);
  }

  /**
   * Clear current progress notification
   */
  clearProgressNotification(): void {
    if (this.currentNotice) {
      this.currentNotice.hide();
      this.currentNotice = null;
    }
  }
}
