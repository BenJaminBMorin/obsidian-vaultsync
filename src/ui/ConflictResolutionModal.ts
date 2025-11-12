import { App, Modal, Setting, Notice } from 'obsidian';
import { ConflictService } from '../services/ConflictService';
import { ConflictInfo, ResolutionStrategy } from '../types';
import { formatRelativeTime } from '../utils/helpers';

/**
 * Conflict Resolution Modal
 * Displays conflicts and allows users to resolve them
 */
export class ConflictResolutionModal extends Modal {
  private conflictService: ConflictService;
  private conflicts: ConflictInfo[] = [];
  private currentConflictIndex: number = 0;
  private onResolved?: () => void;

  constructor(
    app: App,
    conflictService: ConflictService,
    onResolved?: () => void
  ) {
    super(app);
    this.conflictService = conflictService;
    this.onResolved = onResolved;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('vaultsync-conflict-modal');

    // Load conflicts
    this.conflicts = this.conflictService.getConflicts();

    if (this.conflicts.length === 0) {
      this.showNoConflicts();
      return;
    }

    this.renderConflictView();
  }

  private showNoConflicts() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'No Conflicts' });
    
    const message = contentEl.createDiv({ cls: 'conflict-no-conflicts' });
    message.textContent = 'All files are in sync. No conflicts to resolve.';
    message.style.textAlign = 'center';
    message.style.padding = '40px 20px';
    message.style.color = 'var(--text-muted)';

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.textAlign = 'center';

    const closeButton = buttonContainer.createEl('button', {
      text: 'Close',
      cls: 'mod-cta'
    });
    closeButton.addEventListener('click', () => {
      this.close();
    });
  }

  private renderConflictView() {
    const { contentEl } = this;
    contentEl.empty();

    const conflict = this.conflicts[this.currentConflictIndex];

    // Header
    const header = contentEl.createDiv({ cls: 'conflict-header' });
    header.style.marginBottom = '20px';

    const title = header.createEl('h2', {
      text: `Resolve Conflict: ${conflict.path}`
    });
    title.style.marginBottom = '8px';

    const info = header.createDiv({ cls: 'conflict-info' });
    info.style.color = 'var(--text-muted)';
    info.style.fontSize = '0.9em';
    info.textContent = `Conflict ${this.currentConflictIndex + 1} of ${this.conflicts.length} • Type: ${conflict.conflictType}`;

    // Cross-tenant warning banner
    const isCrossTenant = (this.conflictService as any).isCrossTenant;
    const permission = (this.conflictService as any).vaultPermission;
    
    if (isCrossTenant) {
      const warningBanner = contentEl.createDiv({ cls: 'conflict-cross-tenant-warning' });
      warningBanner.style.marginTop = '15px';
      warningBanner.style.padding = '12px';
      warningBanner.style.background = 'rgba(255, 152, 0, 0.1)';
      warningBanner.style.border = '1px solid rgba(255, 152, 0, 0.3)';
      warningBanner.style.borderRadius = '6px';
      warningBanner.style.marginBottom = '15px';
      
      const warningTitle = warningBanner.createEl('div', {
        text: '🔗 Cross-Tenant Vault Conflict',
        cls: 'conflict-warning-title'
      });
      warningTitle.style.fontWeight = '600';
      warningTitle.style.marginBottom = '8px';
      
      const warningText = warningBanner.createEl('div', {
        cls: 'conflict-warning-text'
      });
      warningText.style.fontSize = '0.9em';
      warningText.style.lineHeight = '1.4';
      
      if (permission === 'read') {
        warningText.textContent = '⚠️ This vault is shared with read-only access. The remote version will be used automatically to prevent sync conflicts.';
      } else {
        warningText.textContent = '💡 For cross-tenant vaults, it\'s recommended to keep the remote version as the source of truth to avoid sync conflicts with the vault owner.';
      }
    }

    // Navigation buttons (if multiple conflicts)
    if (this.conflicts.length > 1) {
      const nav = header.createDiv({ cls: 'conflict-navigation' });
      nav.style.marginTop = '10px';
      nav.style.display = 'flex';
      nav.style.gap = '10px';

      const prevButton = nav.createEl('button', { text: '← Previous' });
      prevButton.disabled = this.currentConflictIndex === 0;
      prevButton.addEventListener('click', () => {
        this.currentConflictIndex--;
        this.renderConflictView();
      });

      const nextButton = nav.createEl('button', { text: 'Next →' });
      nextButton.disabled = this.currentConflictIndex === this.conflicts.length - 1;
      nextButton.addEventListener('click', () => {
        this.currentConflictIndex++;
        this.renderConflictView();
      });
    }

    // Conflict details
    this.renderConflictDetails(contentEl, conflict);

    // Resolution buttons
    this.renderResolutionButtons(contentEl, conflict);
  }

  private renderConflictDetails(container: HTMLElement, conflict: ConflictInfo) {
    const detailsContainer = container.createDiv({ cls: 'conflict-details' });
    detailsContainer.style.marginTop = '20px';

    // Timestamps
    const timestamps = detailsContainer.createDiv({ cls: 'conflict-timestamps' });
    timestamps.style.marginBottom = '15px';
    timestamps.style.display = 'flex';
    timestamps.style.justifyContent = 'space-between';
    timestamps.style.fontSize = '0.9em';
    timestamps.style.color = 'var(--text-muted)';

    const localTime = timestamps.createDiv();
    localTime.textContent = `Local: ${formatRelativeTime(conflict.localModified)}`;

    const remoteTime = timestamps.createDiv();
    remoteTime.textContent = `Remote: ${formatRelativeTime(conflict.remoteModified)}`;

    // Side-by-side diff view
    const diffContainer = detailsContainer.createDiv({ cls: 'conflict-diff' });
    diffContainer.style.display = 'grid';
    diffContainer.style.gridTemplateColumns = '1fr 1fr';
    diffContainer.style.gap = '10px';
    diffContainer.style.marginBottom = '20px';

    // Local version
    const localPanel = diffContainer.createDiv({ cls: 'conflict-panel' });
    localPanel.style.border = '1px solid var(--background-modifier-border)';
    localPanel.style.borderRadius = '4px';
    localPanel.style.padding = '10px';

    const localHeader = localPanel.createDiv({ cls: 'conflict-panel-header' });
    localHeader.textContent = 'Local Version';
    localHeader.style.fontWeight = 'bold';
    localHeader.style.marginBottom = '10px';
    localHeader.style.color = 'var(--text-accent)';

    const localContent = localPanel.createEl('pre', { cls: 'conflict-content' });
    localContent.textContent = conflict.localContent || '(deleted)';
    localContent.style.maxHeight = '300px';
    localContent.style.overflowY = 'auto';
    localContent.style.fontSize = '0.85em';
    localContent.style.whiteSpace = 'pre-wrap';
    localContent.style.wordBreak = 'break-word';

    // Remote version
    const remotePanel = diffContainer.createDiv({ cls: 'conflict-panel' });
    remotePanel.style.border = '1px solid var(--background-modifier-border)';
    remotePanel.style.borderRadius = '4px';
    remotePanel.style.padding = '10px';

    const remoteHeader = remotePanel.createDiv({ cls: 'conflict-panel-header' });
    remoteHeader.textContent = 'Remote Version';
    remoteHeader.style.fontWeight = 'bold';
    remoteHeader.style.marginBottom = '10px';
    remoteHeader.style.color = 'var(--text-accent)';

    const remoteContent = remotePanel.createEl('pre', { cls: 'conflict-content' });
    remoteContent.textContent = conflict.remoteContent || '(deleted)';
    remoteContent.style.maxHeight = '300px';
    remoteContent.style.overflowY = 'auto';
    remoteContent.style.fontSize = '0.85em';
    remoteContent.style.whiteSpace = 'pre-wrap';
    remoteContent.style.wordBreak = 'break-word';
  }

  private renderResolutionButtons(container: HTMLElement, conflict: ConflictInfo) {
    const buttonContainer = container.createDiv({ cls: 'conflict-resolution-buttons' });
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '10px';

    // Check cross-tenant status
    const isCrossTenant = (this.conflictService as any).isCrossTenant;
    const permission = (this.conflictService as any).vaultPermission;
    const isReadOnly = isCrossTenant && permission === 'read';

    // Resolution options
    const optionsContainer = buttonContainer.createDiv({ cls: 'resolution-options' });
    optionsContainer.style.display = 'grid';
    optionsContainer.style.gridTemplateColumns = '1fr 1fr';
    optionsContainer.style.gap = '10px';

    // Keep Local button (disabled for read-only cross-tenant vaults)
    const keepLocalBtn = optionsContainer.createEl('button', {
      text: 'Keep Local',
      cls: 'mod-cta'
    });
    
    if (isReadOnly) {
      keepLocalBtn.disabled = true;
      keepLocalBtn.title = 'Cannot keep local version in read-only cross-tenant vault';
      keepLocalBtn.style.opacity = '0.5';
      keepLocalBtn.style.cursor = 'not-allowed';
    } else {
      keepLocalBtn.addEventListener('click', () => {
        this.resolveConflict(conflict, ResolutionStrategy.KEEP_LOCAL);
      });
    }

    // Keep Remote button
    const keepRemoteBtn = optionsContainer.createEl('button', {
      text: 'Keep Remote',
      cls: 'mod-cta'
    });
    keepRemoteBtn.addEventListener('click', () => {
      this.resolveConflict(conflict, ResolutionStrategy.KEEP_REMOTE);
    });

    // Keep Both button
    const keepBothBtn = optionsContainer.createEl('button', {
      text: 'Keep Both'
    });
    keepBothBtn.addEventListener('click', () => {
      this.resolveConflict(conflict, ResolutionStrategy.KEEP_BOTH);
    });

    // Merge Manually button
    const mergeBtn = optionsContainer.createEl('button', {
      text: 'Merge Manually'
    });
    mergeBtn.addEventListener('click', () => {
      this.showMergeEditor(conflict);
    });

    // Cancel button
    const actionContainer = buttonContainer.createDiv({ cls: 'action-buttons' });
    actionContainer.style.display = 'flex';
    actionContainer.style.justifyContent = 'space-between';
    actionContainer.style.marginTop = '10px';

    const skipBtn = actionContainer.createEl('button', { text: 'Skip' });
    skipBtn.addEventListener('click', () => {
      if (this.currentConflictIndex < this.conflicts.length - 1) {
        this.currentConflictIndex++;
        this.renderConflictView();
      } else {
        this.close();
      }
    });

    const closeBtn = actionContainer.createEl('button', { text: 'Close' });
    closeBtn.addEventListener('click', () => {
      this.close();
    });
  }

  private showMergeEditor(conflict: ConflictInfo) {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: `Manual Merge: ${conflict.path}` });

    const description = contentEl.createDiv({ cls: 'merge-description' });
    description.textContent = 'Edit the content below to create your merged version:';
    description.style.marginBottom = '15px';
    description.style.color = 'var(--text-muted)';

    // Merge editor
    let mergedContent = this.createMergeTemplate(conflict);

    // Preview section
    const previewContainer = contentEl.createDiv({ cls: 'merge-preview' });
    previewContainer.style.marginTop = '20px';

    const previewHeader = previewContainer.createEl('h3', { text: 'Preview' });
    previewHeader.style.marginBottom = '10px';

    const previewContent = previewContainer.createEl('div', { cls: 'merge-preview-content' });
    previewContent.style.border = '1px solid var(--background-modifier-border)';
    previewContent.style.borderRadius = '4px';
    previewContent.style.padding = '10px';
    previewContent.style.maxHeight = '200px';
    previewContent.style.overflowY = 'auto';
    previewContent.style.whiteSpace = 'pre-wrap';
    previewContent.style.wordBreak = 'break-word';
    previewContent.textContent = mergedContent;

    new Setting(contentEl)
      .setName('Merged Content')
      .setDesc('Combine both versions as needed')
      .addTextArea(text => {
        text
          .setValue(mergedContent)
          .onChange(value => {
            mergedContent = value;
            previewContent.textContent = value;
          });
        text.inputEl.rows = 20;
        text.inputEl.style.width = '100%';
        text.inputEl.style.fontFamily = 'monospace';
        text.inputEl.style.fontSize = '0.9em';
      });

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';

    const backButton = buttonContainer.createEl('button', { text: 'Back' });
    backButton.addEventListener('click', () => {
      this.renderConflictView();
    });

    const saveButton = buttonContainer.createEl('button', {
      text: 'Save Merged Version',
      cls: 'mod-cta'
    });
    saveButton.addEventListener('click', () => {
      this.resolveConflict(conflict, ResolutionStrategy.MERGE_MANUAL, mergedContent);
    });
  }

  private createMergeTemplate(conflict: ConflictInfo): string {
    // Create a merge template with conflict markers
    return `<<<<<<< LOCAL\n${conflict.localContent}\n=======\n${conflict.remoteContent}\n>>>>>>> REMOTE`;
  }

  private async resolveConflict(
    conflict: ConflictInfo,
    strategy: ResolutionStrategy,
    mergedContent?: string
  ) {
    try {
      // Show resolving notice
      new Notice(`Resolving conflict...`);

      // Call the conflict service to resolve
      await this.conflictService.resolveConflict(conflict.id, {
        strategy,
        mergedContent
      });

      // Show success notice
      new Notice(`Conflict resolved: ${conflict.path}`);
      
      // Remove conflict from list
      this.conflicts = this.conflicts.filter(c => c.id !== conflict.id);
      
      // If no more conflicts, close modal
      if (this.conflicts.length === 0) {
        new Notice('All conflicts resolved!');
        if (this.onResolved) {
          this.onResolved();
        }
        this.close();
        return;
      }

      // Move to next conflict or previous if at end
      if (this.currentConflictIndex >= this.conflicts.length) {
        this.currentConflictIndex = this.conflicts.length - 1;
      }

      // Re-render
      this.renderConflictView();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to resolve conflict: ${errorMessage}`);
      console.error('Error resolving conflict:', error);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
