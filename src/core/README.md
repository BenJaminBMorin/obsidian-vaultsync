# Core Components

This directory contains the core infrastructure components for the VaultSync Obsidian plugin.

## WebSocketManager

The `WebSocketManager` class handles WebSocket connections for real-time features including:

- Connection management with authentication
- Automatic reconnection with exponential backoff
- Heartbeat mechanism to detect dead connections
- Message queueing during disconnection
- Event-based communication

### Basic Usage

```typescript
import { WebSocketManager, ConnectionState } from './core/WebSocketManager';
import { AuthService } from './services/AuthService';
import { EventBus } from './core/EventBus';

// Initialize
const eventBus = new EventBus();
const authService = new AuthService(plugin, eventBus);
const wsManager = new WebSocketManager(
  authService,
  eventBus,
  'ws://localhost:3001', // WebSocket base URL
  true // debug mode
);

// Connect
const apiKey = await authService.getApiKey();
await wsManager.connect(apiKey, vaultId);

// Subscribe to vault events
await wsManager.subscribe(vaultId, deviceId);

// Listen for events
wsManager.on('sync_event', (data) => {
  console.log('File synced:', data);
});

wsManager.on('conflict', (data) => {
  console.log('Conflict detected:', data);
});

// Send messages
wsManager.send('presence_update', {
  status: 'active',
  current_file: 'notes/example.md'
});

// Handle connection state changes
wsManager.onConnected(() => {
  console.log('Connected to WebSocket server');
});

wsManager.onDisconnected((reason) => {
  console.log('Disconnected:', reason);
});

wsManager.onReconnecting((attempt) => {
  console.log(`Reconnecting... attempt ${attempt}`);
});

// Disconnect
await wsManager.disconnect();
```

### Connection States

- `DISCONNECTED`: Not connected
- `CONNECTING`: Connection in progress
- `CONNECTED`: Successfully connected
- `RECONNECTING`: Attempting to reconnect
- `ERROR`: Connection error occurred

### Auto-Reconnection

The WebSocketManager automatically attempts to reconnect when the connection is lost:

- Uses exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
- Maximum 10 reconnection attempts by default
- Queues messages during disconnection
- Processes queued messages after reconnection

```typescript
// Enable/disable auto-reconnect
wsManager.enableAutoReconnect();
wsManager.disableAutoReconnect();

// Check queue size
const queueSize = wsManager.getQueueSize();

// Clear message queue
wsManager.clearQueue();
```

### Heartbeat Mechanism

The WebSocketManager sends periodic ping messages to detect dead connections:

- Sends ping every 30 seconds
- Expects pong response within 10 seconds
- Automatically reconnects if heartbeat fails

## WebSocketEventHandler

The `WebSocketEventHandler` processes WebSocket events and emits plugin-level events.

### Usage

```typescript
import { WebSocketEventHandler } from './services/WebSocketEventHandler';

const eventHandler = new WebSocketEventHandler(wsManager, eventBus);
eventHandler.initialize();

// Now listen for plugin events
eventBus.on(EVENTS.FILE_SYNCED, (data) => {
  console.log('File synced from remote:', data);
});

eventBus.on(EVENTS.CONFLICT_DETECTED, (conflict) => {
  console.log('Conflict detected:', conflict);
});

eventBus.on(EVENTS.USER_JOINED, (user) => {
  console.log('User joined vault:', user);
});
```

### Handled Events

**Sync Events:**
- `sync_event`: File updated from another device
- `file_update`: Real-time file update notification

**Device Events:**
- `device_connected`: Another device connected
- `device_disconnected`: Another device disconnected

**Conflict Events:**
- `conflict`: Conflict detected
- `conflict_resolved`: Conflict resolved

**Presence Events:**
- `user_joined`: User joined vault
- `user_left`: User left vault
- `presence_update`: User presence changed

**Collaboration Events:**
- `collaborator_joined`: User opened same file
- `collaborator_left`: User closed file
- `cursor_update`: Cursor position changed
- `typing_indicator`: User is typing

## ReconnectionService

The `ReconnectionService` handles state resynchronization after reconnection.

### Usage

```typescript
import { ReconnectionService } from './services/ReconnectionService';

const reconnectionService = new ReconnectionService(
  eventBus,
  wsManager,
  syncService,
  conflictService
);

reconnectionService.initialize();

// Check if offline
const isOffline = reconnectionService.isOffline();

// Get offline duration
const duration = reconnectionService.getOfflineDuration();
```

### Reconnection Flow

When reconnection occurs, the service automatically:

1. Processes queued sync operations
2. Checks for conflicts that occurred during offline period
3. Syncs changes that happened while offline
4. Emits appropriate events

## EventBus

The `EventBus` provides plugin-wide event communication.

### Usage

```typescript
import { EventBus, EVENTS } from './core/EventBus';

const eventBus = new EventBus();

// Subscribe to event
const unsubscribe = eventBus.on(EVENTS.SYNC_COMPLETED, (result) => {
  console.log('Sync completed:', result);
});

// Subscribe once
eventBus.once(EVENTS.AUTH_STATE_CHANGED, (isAuthenticated) => {
  console.log('Auth state changed:', isAuthenticated);
});

// Emit event
eventBus.emit(EVENTS.SYNC_STARTED);

// Unsubscribe
unsubscribe();

// Or
eventBus.off(EVENTS.SYNC_COMPLETED, callback);
```

## Integration Example

Here's a complete example of integrating WebSocket functionality into the plugin:

```typescript
import { Plugin } from 'obsidian';
import { EventBus, EVENTS } from './core/EventBus';
import { WebSocketManager } from './core/WebSocketManager';
import { WebSocketEventHandler } from './services/WebSocketEventHandler';
import { ReconnectionService } from './services/ReconnectionService';
import { AuthService } from './services/AuthService';
import { SyncService } from './services/SyncService';
import { ConflictService } from './services/ConflictService';

export default class VaultSyncPlugin extends Plugin {
  private eventBus: EventBus;
  private authService: AuthService;
  private wsManager: WebSocketManager;
  private wsEventHandler: WebSocketEventHandler;
  private reconnectionService: ReconnectionService;
  private syncService: SyncService;
  private conflictService: ConflictService;

  async onload() {
    // Initialize event bus
    this.eventBus = new EventBus();

    // Initialize auth service
    this.authService = new AuthService(this, this.eventBus);
    await this.authService.initialize();

    // Initialize WebSocket manager
    this.wsManager = new WebSocketManager(
      this.authService,
      this.eventBus,
      this.settings.wsBaseURL,
      this.settings.debugMode
    );

    // Initialize other services
    // ... (syncService, conflictService, etc.)

    // Initialize WebSocket event handler
    this.wsEventHandler = new WebSocketEventHandler(
      this.wsManager,
      this.eventBus
    );
    this.wsEventHandler.initialize();

    // Initialize reconnection service
    this.reconnectionService = new ReconnectionService(
      this.eventBus,
      this.wsManager,
      this.syncService,
      this.conflictService
    );
    this.reconnectionService.initialize();

    // Setup event listeners
    this.setupEventListeners();

    // Connect if authenticated
    if (this.authService.isAuthenticated() && this.settings.selectedVaultId) {
      await this.connectWebSocket();
    }
  }

  async connectWebSocket() {
    try {
      const apiKey = await this.authService.getApiKey();
      if (!apiKey) {
        throw new Error('Not authenticated');
      }

      await this.wsManager.connect(apiKey, this.settings.selectedVaultId);
      
      // Subscribe to vault events
      await this.wsManager.subscribe(
        this.settings.selectedVaultId,
        this.settings.deviceId
      );

      console.log('WebSocket connected and subscribed');
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  setupEventListeners() {
    // Connection state changes
    this.eventBus.on(EVENTS.CONNECTION_CHANGED, (state) => {
      this.updateStatusBar(state);
    });

    // File synced from remote
    this.eventBus.on(EVENTS.FILE_SYNCED, async (data) => {
      if (data.source === 'remote') {
        // Handle remote file update
        await this.handleRemoteFileUpdate(data);
      }
    });

    // Conflict detected
    this.eventBus.on(EVENTS.CONFLICT_DETECTED, (conflict) => {
      this.showConflictNotification(conflict);
    });

    // User joined
    this.eventBus.on(EVENTS.USER_JOINED, (user) => {
      if (this.settings.notifyOnCollaboratorJoin) {
        new Notice(`${user.userName} joined the vault`);
      }
    });

    // Offline mode changed
    this.eventBus.on(EVENTS.OFFLINE_MODE_CHANGED, (isOffline) => {
      if (isOffline) {
        new Notice('You are now offline. Changes will be synced when reconnected.');
      } else {
        new Notice('Back online. Syncing changes...');
      }
    });
  }

  async onunload() {
    // Cleanup
    await this.wsManager.disconnect();
    this.wsEventHandler.destroy();
    this.reconnectionService.destroy();
    this.authService.destroy();
    this.eventBus.clear();
  }
}
```

## Error Handling

All WebSocket operations include proper error handling:

```typescript
try {
  await wsManager.connect(apiKey, vaultId);
} catch (error) {
  console.error('Connection failed:', error);
  // Handle error (show notification, retry, etc.)
}

// Listen for connection errors
wsManager.onError((error) => {
  console.error('WebSocket error:', error);
  new Notice('Connection error. Will retry automatically.');
});
```

## Testing

For testing, you can disable auto-reconnect and use mock WebSocket servers:

```typescript
// Disable auto-reconnect for testing
wsManager.disableAutoReconnect();

// Check connection state
const state = wsManager.getConnectionState();
expect(state).toBe(ConnectionState.CONNECTED);

// Check queue size
const queueSize = wsManager.getQueueSize();
expect(queueSize).toBe(0);
```
