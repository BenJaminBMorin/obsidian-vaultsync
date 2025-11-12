/**
 * Settings Integration Example
 * 
 * This file shows how to integrate the SettingsManager into your plugin.
 * Copy the relevant parts to your main plugin file.
 */

import { Plugin } from 'obsidian';
import { PluginSettings } from '../types';
import { SettingsManager } from './SettingsManager';
import { VaultSyncSettingTab } from '../ui/SettingsTab';
import { AuthService } from '../services/AuthService';
import { EventBus } from './EventBus';

/**
 * Example Plugin Class with Settings Integration
 */
export default class VaultSyncPluginExample extends Plugin {
  // Settings
  settings: PluginSettings;
  settingsManager: SettingsManager;
  
  // Core services
  eventBus: EventBus;
  authService: AuthService;
  
  // Other services would go here...

  async onload() {
    console.log('Loading VaultSync plugin...');

    // Step 1: Initialize EventBus
    this.eventBus = new EventBus();

    // Step 2: Initialize SettingsManager
    this.settingsManager = new SettingsManager(this);
    
    // Step 3: Load settings (includes automatic migration)
    this.settings = await this.settingsManager.loadSettings();
    console.log('Settings loaded:', this.settings);

    // Step 4: Initialize AuthService
    this.authService = new AuthService(this as any, this.eventBus);
    await this.authService.initialize();

    // Step 5: Add settings tab
    this.addSettingTab(new VaultSyncSettingTab(this.app, this));

    // Step 6: Initialize other services...
    // this.syncService = new SyncService(...);
    // this.vaultService = new VaultService(...);
    // etc.

    // Step 7: Register commands, events, etc.
    this.registerCommands();
    this.registerEvents();

    console.log('VaultSync plugin loaded successfully');
  }

  async onunload() {
    console.log('Unloading VaultSync plugin...');
    
    // Clean up services
    // Note: Add cleanup methods to your services as needed
    // if (this.authService && typeof this.authService.cleanup === 'function') {
    //   await this.authService.cleanup();
    // }
    
    // Save settings one last time
    await this.saveSettings();
    
    console.log('VaultSync plugin unloaded');
  }

  /**
   * Save settings using SettingsManager
   */
  async saveSettings(): Promise<void> {
    try {
      await this.settingsManager.saveSettings();
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Update settings and save
   */
  async updateSettings(updates: Partial<PluginSettings>): Promise<void> {
    this.settingsManager.updateSettings(updates);
    await this.saveSettings();
  }

  /**
   * Register plugin commands
   */
  private registerCommands(): void {
    // Export settings command
    this.addCommand({
      id: 'export-settings',
      name: 'Export Settings',
      callback: () => {
        const json = this.settingsManager.exportSettings();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `vaultsync-settings-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
      }
    });

    // Import settings command
    this.addCommand({
      id: 'import-settings',
      name: 'Import Settings',
      callback: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = async (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          
          const text = await file.text();
          const success = await this.settingsManager.importSettings(text);
          
          if (success) {
            // Reload settings reference
            this.settings = this.settingsManager.getSettings();
            console.log('Settings imported successfully');
          } else {
            console.error('Failed to import settings');
          }
        };
        
        input.click();
      }
    });

    // Reset settings command
    this.addCommand({
      id: 'reset-settings',
      name: 'Reset Settings to Defaults',
      callback: async () => {
        const confirmed = confirm(
          'Are you sure you want to reset all settings to defaults? ' +
          'This will preserve your authentication and device ID.'
        );
        
        if (confirmed) {
          await this.settingsManager.resetSettings();
          this.settings = this.settingsManager.getSettings();
          console.log('Settings reset to defaults');
        }
      }
    });

    // Add other commands...
  }

  /**
   * Register plugin events
   */
  private registerEvents(): void {
    // Listen for auth state changes
    this.eventBus.on('auth:state-changed', (isAuthenticated: boolean) => {
      console.log('Auth state changed:', isAuthenticated);
      // Update UI, reconnect services, etc.
    });

    // Listen for settings changes
    this.eventBus.on('settings:changed', (settings: PluginSettings) => {
      console.log('Settings changed:', settings);
      // React to settings changes
    });

    // Add other event listeners...
  }
}

/**
 * Example: Accessing settings in a service
 */
export class ExampleService {
  private plugin: VaultSyncPluginExample;

  constructor(plugin: VaultSyncPluginExample) {
    this.plugin = plugin;
  }

  doSomething(): void {
    // Access settings through plugin
    const syncMode = this.plugin.settings.syncMode;
    const autoSync = this.plugin.settings.autoSync;
    
    console.log('Current sync mode:', syncMode);
    console.log('Auto sync enabled:', autoSync);
    
    // Update settings
    this.plugin.updateSettings({
      autoSync: !autoSync
    });
  }
}

/**
 * Example: Reacting to settings changes
 */
export class SettingsAwareService {
  private plugin: VaultSyncPluginExample;

  constructor(plugin: VaultSyncPluginExample) {
    this.plugin = plugin;
    
    // Listen for settings changes
    this.plugin.eventBus.on('settings:changed', (settings) => {
      this.onSettingsChanged(settings);
    });
  }

  private onSettingsChanged(settings: PluginSettings): void {
    // React to specific setting changes
    if (settings.debugMode) {
      console.log('Debug mode enabled');
    }
    
    if (settings.syncMode === 'manual') {
      console.log('Switched to manual sync mode');
      // Disable auto-sync
    }
  }
}
