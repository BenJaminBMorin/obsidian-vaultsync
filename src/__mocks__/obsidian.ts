// Mock Obsidian API for testing

export class Plugin {
  app: any;
  manifest: any;
  
  async loadData(): Promise<any> {
    return {};
  }
  
  async saveData(data: any): Promise<void> {
    // Mock implementation
  }
}

export class TFile {
  path: string;
  name: string;
  extension: string;
  stat: { mtime: number; ctime: number; size: number };
  
  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() || '';
    this.extension = this.name.split('.').pop() || '';
    this.stat = {
      mtime: Date.now(),
      ctime: Date.now(),
      size: 0
    };
  }
}

export class TAbstractFile {
  path: string;
  name: string;
  
  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() || '';
  }
}

export class Vault {
  async read(file: TFile): Promise<string> {
    return '';
  }
  
  async modify(file: TFile, content: string): Promise<void> {
    // Mock implementation
  }
  
  async create(path: string, content: string): Promise<TFile> {
    return new TFile(path);
  }
  
  async delete(file: TFile): Promise<void> {
    // Mock implementation
  }
  
  getAbstractFileByPath(path: string): TAbstractFile | null {
    return null;
  }
  
  getMarkdownFiles(): TFile[] {
    return [];
  }
}

export class Notice {
  constructor(message: string, timeout?: number) {
    // Mock implementation
  }
}

export class Modal {
  app: any;
  
  constructor(app: any) {
    this.app = app;
  }
  
  open(): void {
    // Mock implementation
  }
  
  close(): void {
    // Mock implementation
  }
}

export class PluginSettingTab {
  app: any;
  plugin: Plugin;
  
  constructor(app: any, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
  }
  
  display(): void {
    // Mock implementation
  }
  
  hide(): void {
    // Mock implementation
  }
}
