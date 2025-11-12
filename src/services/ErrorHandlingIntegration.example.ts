/**
 * Error Handling Integration Example
 * 
 * This file demonstrates how to integrate the error handling system
 * into the VaultSync plugin.
 */

import { Plugin } from 'obsidian';
import { EventBus } from '../core/EventBus';
import { StorageManager } from '../core/StorageManager';
import { AuthService } from './AuthService';
import { WebSocketManager } from '../core/WebSocketManager';
import { ErrorNotificationService } from './ErrorNotificationService';
import {
  ErrorRecoveryManager,
  VaultSyncError,
  NetworkError,
  AuthenticationError,
  SyncError,
  ErrorLogger
} from '../utils/errors';
import { getDefaultRecoveryStrategies } from './ErrorRecoveryStrategies';

/**
 * Example: Initialize error handling in main plugin
 */
export class ErrorHandlingExample {
  private plugin: Plugin;
  private eventBus: EventBus;
  private errorNotificationService: ErrorNotificationService;
  private errorRecoveryManager: ErrorRecoveryManager;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.eventBus = new EventBus();
    
    // Initialize error notification service
    this.errorNotificationService = new ErrorNotificationService(
      plugin,
      this.eventBus,
      {
        showNotifications: true,
        showDetailsInConsole: true,
        notificationDuration: 7000,
        enableErrorReporting: false // Set to true only with user consent
      }
    );

    // Initialize error recovery manager
    this.errorRecoveryManager = new ErrorRecoveryManager();
    this.setupRecoveryStrategies();
  }

  /**
   * Setup recovery strategies
   */
  private setupRecoveryStrategies(): void {
    // This would use actual service instances in real implementation
    const authService = {} as AuthService;
    const wsManager = {} as WebSocketManager;
    const storage = {} as StorageManager;

    const strategies = getDefaultRecoveryStrategies(authService, wsManager, storage);

    // Register all strategies
    strategies.forEach((strategyList, errorType) => {
      strategyList.forEach(strategy => {
        this.errorRecoveryManager.registerStrategy(errorType, strategy);
      });
    });
  }

  /**
   * Example 1: Handle network error with automatic retry
   */
  async handleNetworkError(): Promise<void> {
    try {
      // Simulate API call
      await this.makeApiCall();
    } catch (error) {
      // Create typed error
      const networkError = new NetworkError(
        'Failed to connect to server',
        error instanceof Error ? error : undefined,
        { endpoint: '/api/vaults' }
      );

      // Log the error
      ErrorLogger.log(networkError);

      // Show notification
      this.errorNotificationService.showNetworkError(
        networkError,
        () => this.handleNetworkError() // Retry callback
      );

      // Attempt automatic recovery
      const recovered = await this.errorRecoveryManager.attemptRecovery(networkError);
      
      if (recovered) {
        console.log('Successfully recovered from network error');
        // Retry the operation
        await this.handleNetworkError();
      }
    }
  }

  /**
   * Example 2: Handle authentication error
   */
  async handleAuthError(): Promise<void> {
    try {
      // Simulate authenticated API call
      await this.makeAuthenticatedApiCall();
    } catch (error) {
      const authError = new AuthenticationError(
        'API key expired',
        error instanceof Error ? error : undefined
      );

      ErrorLogger.log(authError);

      // Show notification with login action
      this.errorNotificationService.showAuthError(
        authError,
        () => this.openLoginModal()
      );
    }
  }

  /**
   * Example 3: Handle sync error with context
   */
  async handleSyncError(filePath: string): Promise<void> {
    try {
      // Simulate file sync
      await this.syncFile(filePath);
    } catch (error) {
      const syncError = new SyncError(
        `Failed to sync file: ${filePath}`,
        'Unable to sync file. Will retry automatically.',
        error instanceof Error ? error : undefined,
        { filePath, operation: 'upload' }
      );

      ErrorLogger.log(syncError);

      // Show notification
      this.errorNotificationService.showSyncError(syncError, filePath);

      // Attempt recovery if retryable
      if (syncError.retryable) {
        const recovered = await this.errorRecoveryManager.attemptRecovery(syncError);
        
        if (recovered) {
          // Retry the sync
          await this.handleSyncError(filePath);
        }
      }
    }
  }

  /**
   * Example 4: Handle multiple errors with error classification
   */
  async handleGenericError(operation: string): Promise<void> {
    try {
      // Simulate operation
      await this.performOperation(operation);
    } catch (error) {
      // Let the error notification service classify and handle it
      this.errorNotificationService.handleError(error, {
        context: { operation }
      });
    }
  }

  /**
   * Example 5: Get error logs for debugging
   */
  getErrorLogs(): void {
    const allLogs = ErrorLogger.getLogs();
    console.log('All error logs:', allLogs);

    // Get logs by type
    const syncErrors = this.errorNotificationService.getErrorLogsByType(
      require('../utils/errors').ErrorType.SYNC_ERROR
    );
    console.log('Sync errors:', syncErrors);

    // Export logs
    const exportedLogs = this.errorNotificationService.exportErrorLogs();
    console.log('Exported logs:', exportedLogs);
  }

  /**
   * Example 6: Show success notification
   */
  showSuccessNotification(): void {
    this.errorNotificationService.showSuccess('Files synced successfully!');
  }

  /**
   * Example 7: Show warning notification
   */
  showWarningNotification(): void {
    this.errorNotificationService.showWarning(
      'API key expires in 3 days. Please renew soon.'
    );
  }

  /**
   * Example 8: Update error notification config
   */
  updateErrorConfig(): void {
    this.errorNotificationService.updateConfig({
      showNotifications: true,
      showDetailsInConsole: false,
      notificationDuration: 5000
    });
  }

  /**
   * Example 9: Clear error logs
   */
  clearLogs(): void {
    this.errorNotificationService.clearErrorLogs();
  }

  // Mock methods for examples
  private async makeApiCall(): Promise<void> {
    throw new Error('Network error');
  }

  private async makeAuthenticatedApiCall(): Promise<void> {
    throw new Error('Unauthorized');
  }

  private async syncFile(filePath: string): Promise<void> {
    throw new Error('Sync failed');
  }

  private async performOperation(operation: string): Promise<void> {
    throw new Error('Operation failed');
  }

  private openLoginModal(): void {
    console.log('Opening login modal...');
  }
}

/**
 * Example: Using error handling in a service
 */
export class ServiceWithErrorHandling {
  private errorNotificationService: ErrorNotificationService;

  constructor(errorNotificationService: ErrorNotificationService) {
    this.errorNotificationService = errorNotificationService;
  }

  /**
   * Example method with comprehensive error handling
   */
  async performSyncOperation(filePath: string): Promise<boolean> {
    try {
      // Perform the operation
      await this.doSync(filePath);
      
      // Show success notification
      this.errorNotificationService.showSuccess(`Synced ${filePath}`);
      
      return true;
    } catch (error) {
      // Handle the error
      this.errorNotificationService.handleError(error, {
        context: {
          operation: 'sync',
          filePath
        }
      });
      
      return false;
    }
  }

  private async doSync(filePath: string): Promise<void> {
    // Sync implementation
    throw new Error('Not implemented');
  }
}

/**
 * Example: Global error handler setup
 */
export function setupGlobalErrorHandler(
  plugin: Plugin,
  errorNotificationService: ErrorNotificationService
): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    errorNotificationService.handleError(event.reason, {
      context: { source: 'unhandledRejection' }
    });
    
    // Prevent default error handling
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    errorNotificationService.handleError(event.error, {
      context: { source: 'globalError' }
    });
  });
}
