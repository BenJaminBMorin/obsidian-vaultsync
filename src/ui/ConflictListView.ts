import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { ConflictService } from '../services/ConflictService';
import { ConflictInfo } from '../types';
import { formatRelativeTime } from '../utils/helpers';
import { ConflictResolutionModal } from './ConflictResolutionModal';

export const CONFLICT_LIST_VIEW_TYPE = 'vaultsync-conflict-list';

/**
 * Conflict List View
 * Shows all conflicts in a sidebar panel
 */
export class ConflictListView extends ItemView {
  private conflictService: ConflictService;
  private conflicts: ConflictInfo[] = [];

  constructor(leaf: WorkspaceLeaf, conflictService: ConflictService) {
    super(leaf);
    this.conflictService = conflictService;
  }

  getViewType(): string {
    return CONFLICT_LIST_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Conflicts';
  }

  getIcon(): string {
    return 'alert-triangle';
  }

  async onOpen() {
    await this.refresh();
  }

  async refresh() {
    this.conflicts = this.conflictService.getConflicts();
    this.render();
  }

  private render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('vaultsync-conflict-list');

    // Header
    const header = container.createDiv({ cls: 'conflict-list-header' });
    header.style.padding = '16px';
    header.style.borderBottom = '1px solid var(--background-modifier-border)';

    const title = header.createEl('h4', { text: 'Sync Conflicts' });
    title.style.margin = '0 0 8px 0';

    const count = header.createDiv({ cls: 'conflict-count' });
    count.style.fontSize = '0.9em';
    count.style.color = 'var(--text-muted)';
    
    if (this.conflicts.length === 0) {
      count.textContent = 'No conflicts';
    } else {
      count.textContent = `${this.conflicts.length} conflict${this.conflicts.length === 1 ? '' : 's'} to resolve`;
    }

    // Refresh button
    const refreshBtn = header.createEl('button', {
      text: 'Refresh',
      cls: 'clickable-icon'
    });
    refreshBtn.style.marginTop = '8px';
    refreshBtn.addEventListener('click', () => {
      this.refresh();
    });

    // Content
    const content = container.createDiv({ cls: 'conflict-list-content' });
    content.style.padding = '8px';
    content.style.overflowY = 'auto';

    if (this.conflicts.length === 0) {
      this.renderEmptyState(content);
    } else {
      this.renderConflictList(content);
    }
  }

  private renderEmptyState(container: HTMLElement) {
    const empty = container.createDiv({ cls: 'conflict-list-empty' });
    empty.style.textAlign = 'center';
    empty.style.padding = '40px 20px';
    empty.style.color = 'var(--text-muted)';

    const icon = empty.createDiv({ cls: 'conflict-empty-icon' });
    icon.textContent = '✓';
    icon.style.fontSize = '48px';
    icon.style.marginBottom = '16px';
    icon.style.color = 'var(--text-success)';

    const message = empty.createDiv({ cls: 'conflict-empty-message' });
    message.textContent = 'All files are in sync';
    message.style.fontSize = '1.1em';
  }

  private renderConflictList(container: HTMLElement) {
    this.conflicts.forEach(conflict => {
      this.renderConflictItem(container, conflict);
    });

    // Resolve all button
    const footer = container.createDiv({ cls: 'conflict-list-footer' });
    footer.style.marginTop = '16px';
    footer.style.padding = '8px';
    footer.style.borderTop = '1px solid var(--background-modifier-border)';

    const resolveAllBtn = footer.createEl('button', {
      text: 'Resolve All Conflicts',
      cls: 'mod-cta'
    });
    resolveAllBtn.style.width = '100%';
    resolveAllBtn.addEventListener('click', () => {
      this.openConflictResolutionModal();
    });
  }

  private renderConflictItem(container: HTMLElement, conflict: ConflictInfo) {
    const item = container.createDiv({ cls: 'conflict-list-item' });
    item.style.padding = '12px';
    item.style.marginBottom = '8px';
    item.style.border = '1px solid var(--background-modifier-border)';
    item.style.borderRadius = '4px';
    item.style.cursor = 'pointer';
    item.style.transition = 'background-color 0.2s';

    // Hover effect
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = 'var(--background-modifier-hover)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = '';
    });

    // Click to resolve
    item.addEventListener('click', () => {
      this.openConflictResolutionModal(conflict);
    });

    // Conflict type badge
    const badge = item.createDiv({ cls: 'conflict-type-badge' });
    badge.textContent = conflict.conflictType.toUpperCase();
    badge.style.display = 'inline-block';
    badge.style.padding = '2px 8px';
    badge.style.fontSize = '0.75em';
    badge.style.fontWeight = 'bold';
    badge.style.borderRadius = '3px';
    badge.style.marginBottom = '8px';
    
    if (conflict.conflictType === 'content') {
      badge.style.backgroundColor = 'var(--background-modifier-error)';
      badge.style.color = 'var(--text-error)';
    } else if (conflict.conflictType === 'deletion') {
      badge.style.backgroundColor = 'var(--background-modifier-warning)';
      badge.style.color = 'var(--text-warning)';
    }

    // File path
    const path = item.createDiv({ cls: 'conflict-path' });
    path.textContent = conflict.path;
    path.style.fontWeight = '500';
    path.style.marginBottom = '4px';
    path.style.wordBreak = 'break-word';

    // Timestamps
    const timestamps = item.createDiv({ cls: 'conflict-timestamps' });
    timestamps.style.fontSize = '0.85em';
    timestamps.style.color = 'var(--text-muted)';
    
    const localTime = formatRelativeTime(conflict.localModified);
    const remoteTime = formatRelativeTime(conflict.remoteModified);
    timestamps.textContent = `Local: ${localTime} • Remote: ${remoteTime}`;

    // Action hint
    const hint = item.createDiv({ cls: 'conflict-hint' });
    hint.textContent = 'Click to resolve →';
    hint.style.fontSize = '0.8em';
    hint.style.color = 'var(--text-accent)';
    hint.style.marginTop = '8px';
  }

  private openConflictResolutionModal(conflict?: ConflictInfo) {
    const modal = new ConflictResolutionModal(
      this.app,
      this.conflictService,
      () => {
        // Refresh the list after resolution
        this.refresh();
      }
    );

    // If a specific conflict was clicked, navigate to it
    if (conflict) {
      const conflicts = this.conflictService.getConflicts();
      const index = conflicts.findIndex(c => c.id === conflict.id);
      if (index >= 0) {
        // Set the current index (we'll need to expose this in the modal)
        // For now, the modal will start at the first conflict
      }
    }

    modal.open();
  }

  async onClose() {
    // Cleanup if needed
  }
}
