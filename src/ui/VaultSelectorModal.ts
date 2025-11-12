import { App, Modal, Setting, Notice } from 'obsidian';
import { VaultService } from '../services/VaultService';
import { VaultInfo } from '../types';
import { formatFileSize, formatRelativeTime } from '../utils/helpers';

/**
 * Vault Selector Modal
 * Allows users to browse and select vaults
 */
export class VaultSelectorModal extends Modal {
  private vaultService: VaultService;
  private onSelect: (vault: VaultInfo) => void;
  private vaults: VaultInfo[] = [];
  private filteredVaults: VaultInfo[] = [];
  private searchQuery: string = '';
  private isLoading: boolean = false;

  constructor(
    app: App,
    vaultService: VaultService,
    onSelect: (vault: VaultInfo) => void
  ) {
    super(app);
    this.vaultService = vaultService;
    this.onSelect = onSelect;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('vaultsync-vault-selector');

    contentEl.createEl('h2', { text: 'Select a Vault' });

    // Search box
    const searchContainer = contentEl.createDiv({ cls: 'vault-search-container' });
    new Setting(searchContainer)
      .setName('Search')
      .addText(text => {
        text
          .setPlaceholder('Search vaults...')
          .onChange(value => {
            this.searchQuery = value;
            this.filterVaults();
            this.renderVaultList();
          });
        text.inputEl.focus();
      });

    // Vault list container
    const listContainer = contentEl.createDiv({ cls: 'vault-list-container' });
    listContainer.style.maxHeight = '400px';
    listContainer.style.overflowY = 'auto';
    listContainer.style.marginTop = '10px';

    // Load vaults
    await this.loadVaults(listContainer);

    // Create new vault button
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';

    const createButton = buttonContainer.createEl('button', {
      text: 'Create New Vault'
    });
    createButton.addEventListener('click', () => {
      this.showCreateVaultDialog();
    });

    const cancelButton = buttonContainer.createEl('button', {
      text: 'Cancel'
    });
    cancelButton.addEventListener('click', () => {
      this.close();
    });
  }

  private async loadVaults(container: HTMLElement) {
    this.isLoading = true;
    container.empty();

    const loadingEl = container.createDiv({ cls: 'vault-loading' });
    loadingEl.textContent = 'Loading vaults...';

    try {
      this.vaults = await this.vaultService.fetchVaults(true);
      this.filteredVaults = this.vaults;
      this.renderVaultList();
    } catch (error) {
      container.empty();
      const errorEl = container.createDiv({ cls: 'vault-error' });
      errorEl.textContent = `Failed to load vaults: ${error.message}`;
      errorEl.style.color = 'var(--text-error)';
    } finally {
      this.isLoading = false;
    }
  }

  private filterVaults() {
    if (!this.searchQuery.trim()) {
      this.filteredVaults = this.vaults;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredVaults = this.vaults.filter(vault =>
      vault.name.toLowerCase().includes(query)
    );
  }

  private renderVaultList() {
    const { contentEl } = this;
    const listContainer = contentEl.querySelector('.vault-list-container');
    if (!listContainer) return;

    listContainer.empty();

    if (this.filteredVaults.length === 0) {
      const emptyEl = listContainer.createDiv({ cls: 'vault-empty' });
      emptyEl.textContent = this.searchQuery
        ? 'No vaults found matching your search'
        : 'No vaults available. Create one to get started!';
      emptyEl.style.textAlign = 'center';
      emptyEl.style.padding = '20px';
      emptyEl.style.color = 'var(--text-muted)';
      return;
    }

    // Render vault items
    this.filteredVaults.forEach(vault => {
      this.renderVaultItem(listContainer as HTMLElement, vault);
    });
  }

  private renderVaultItem(container: HTMLElement, vault: VaultInfo) {
    const item = container.createDiv({ cls: 'vault-item' });
    item.style.padding = '12px';
    item.style.border = '1px solid var(--background-modifier-border)';
    item.style.borderRadius = '4px';
    item.style.marginBottom = '8px';
    item.style.cursor = 'pointer';
    item.style.transition = 'background-color 0.2s';

    // Hover effect
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = 'var(--background-modifier-hover)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = '';
    });

    // Click handler
    item.addEventListener('click', () => {
      this.selectVault(vault);
    });

    // Vault name
    const nameEl = item.createDiv({ cls: 'vault-name' });
    nameEl.textContent = vault.name;
    nameEl.style.fontWeight = 'bold';
    nameEl.style.marginBottom = '4px';

    // Vault info
    const infoEl = item.createDiv({ cls: 'vault-info' });
    infoEl.style.fontSize = '0.9em';
    infoEl.style.color = 'var(--text-muted)';

    const fileCount = vault.file_count === 1 ? '1 file' : `${vault.file_count} files`;
    const size = formatFileSize(vault.total_size_bytes);
    const updated = formatRelativeTime(vault.updated_at);

    infoEl.textContent = `${fileCount} • ${size} • Updated ${updated}`;

    // Current vault indicator
    const currentVault = this.vaultService.getCurrentVault();
    if (currentVault && currentVault.vault_id === vault.vault_id) {
      const badge = item.createDiv({ cls: 'vault-current-badge' });
      badge.textContent = 'Current';
      badge.style.display = 'inline-block';
      badge.style.padding = '2px 8px';
      badge.style.backgroundColor = 'var(--interactive-accent)';
      badge.style.color = 'var(--text-on-accent)';
      badge.style.borderRadius = '3px';
      badge.style.fontSize = '0.8em';
      badge.style.marginTop = '4px';
    }
  }

  private async selectVault(vault: VaultInfo) {
    try {
      await this.vaultService.selectVault(vault.vault_id);
      new Notice(`Selected vault: ${vault.name}`);
      this.onSelect(vault);
      this.close();
    } catch (error) {
      new Notice(`Failed to select vault: ${error.message}`);
    }
  }

  private showCreateVaultDialog() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Create New Vault' });

    let vaultName = '';

    new Setting(contentEl)
      .setName('Vault Name')
      .setDesc('Enter a name for your new vault')
      .addText(text => {
        text
          .setPlaceholder('My Vault')
          .onChange(value => {
            vaultName = value.trim();
          });
        text.inputEl.focus();
      });

    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';

    const backButton = buttonContainer.createEl('button', { text: 'Back' });
    backButton.addEventListener('click', () => {
      this.onOpen();
    });

    const createButton = buttonContainer.createEl('button', {
      text: 'Create',
      cls: 'mod-cta'
    });
    createButton.addEventListener('click', async () => {
      await this.createVault(vaultName);
    });

    // Handle Enter key
    contentEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.createVault(vaultName);
      }
    });
  }

  private async createVault(name: string) {
    if (!name) {
      new Notice('Please enter a vault name');
      return;
    }

    try {
      const vault = await this.vaultService.createVault(name);
      new Notice(`Vault created: ${vault.name}`);

      // Select the newly created vault
      await this.vaultService.selectVault(vault.vault_id);
      this.onSelect(vault);
      this.close();
    } catch (error) {
      new Notice(`Failed to create vault: ${error.message}`);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
