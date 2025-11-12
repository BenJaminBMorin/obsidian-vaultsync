import { computeHash } from '../utils/helpers';

export interface DeltaOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}

export interface Delta {
  operations: DeltaOperation[];
  baseHash: string;
  targetHash: string;
  size: number;
}

/**
 * Delta Sync Service
 * Implements efficient delta synchronization for large files
 */
export class DeltaSyncService {
  /**
   * Compute delta between two strings
   * Uses a simple diff algorithm optimized for text files
   */
  computeDelta(oldContent: string, newContent: string): Delta {
    const operations: DeltaOperation[] = [];
    
    // Split into lines for better diff granularity
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let oldIndex = 0;
    let newIndex = 0;
    let position = 0;
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        // Remaining lines are insertions
        const insertContent = newLines.slice(newIndex).join('\n');
        if (insertContent) {
          operations.push({
            type: 'insert',
            position,
            content: insertContent + '\n'
          });
        }
        break;
      }
      
      if (newIndex >= newLines.length) {
        // Remaining lines are deletions
        const deleteLength = oldLines.slice(oldIndex).join('\n').length + 1;
        operations.push({
          type: 'delete',
          position,
          length: deleteLength
        });
        break;
      }
      
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];
      
      if (oldLine === newLine) {
        // Lines match, retain
        const retainLength = oldLine.length + 1; // +1 for newline
        operations.push({
          type: 'retain',
          position,
          length: retainLength
        });
        position += retainLength;
        oldIndex++;
        newIndex++;
      } else {
        // Lines differ, check if it's an insertion, deletion, or modification
        const nextOldLine = oldLines[oldIndex + 1];
        const nextNewLine = newLines[newIndex + 1];
        
        if (newLine === nextOldLine) {
          // Deletion
          operations.push({
            type: 'delete',
            position,
            length: oldLine.length + 1
          });
          oldIndex++;
        } else if (oldLine === nextNewLine) {
          // Insertion
          operations.push({
            type: 'insert',
            position,
            content: newLine + '\n'
          });
          position += newLine.length + 1;
          newIndex++;
        } else {
          // Modification (delete + insert)
          operations.push({
            type: 'delete',
            position,
            length: oldLine.length + 1
          });
          operations.push({
            type: 'insert',
            position,
            content: newLine + '\n'
          });
          position += newLine.length + 1;
          oldIndex++;
          newIndex++;
        }
      }
    }
    
    // Optimize operations by merging consecutive operations of the same type
    const optimizedOps = this.optimizeOperations(operations);
    
    return {
      operations: optimizedOps,
      baseHash: '', // Will be set by caller
      targetHash: '', // Will be set by caller
      size: this.calculateDeltaSize(optimizedOps)
    };
  }

  /**
   * Apply delta to content
   */
  applyDelta(content: string, delta: Delta): string {
    let result = content;
    let offset = 0;
    
    for (const op of delta.operations) {
      const actualPosition = op.position + offset;
      
      switch (op.type) {
        case 'insert':
          if (op.content) {
            result = result.slice(0, actualPosition) + 
                    op.content + 
                    result.slice(actualPosition);
            offset += op.content.length;
          }
          break;
          
        case 'delete':
          if (op.length) {
            result = result.slice(0, actualPosition) + 
                    result.slice(actualPosition + op.length);
            offset -= op.length;
          }
          break;
          
        case 'retain':
          // No change needed
          break;
      }
    }
    
    return result;
  }

  /**
   * Check if delta sync should be used
   * Use delta sync for files larger than 1MB
   */
  shouldUseDeltaSync(contentSize: number): boolean {
    return contentSize > 1048576; // 1MB
  }

  /**
   * Calculate delta efficiency
   * Returns the ratio of delta size to full content size
   */
  calculateDeltaEfficiency(deltaSize: number, fullSize: number): number {
    if (fullSize === 0) return 0;
    return 1 - (deltaSize / fullSize);
  }

  /**
   * Optimize operations by merging consecutive operations
   */
  private optimizeOperations(operations: DeltaOperation[]): DeltaOperation[] {
    if (operations.length === 0) return operations;
    
    const optimized: DeltaOperation[] = [];
    let current = operations[0];
    
    for (let i = 1; i < operations.length; i++) {
      const next = operations[i];
      
      if (current.type === next.type) {
        // Merge operations of the same type
        if (current.type === 'insert' && next.type === 'insert') {
          current = {
            type: 'insert',
            position: current.position,
            content: (current.content || '') + (next.content || '')
          };
        } else if (current.type === 'delete' && next.type === 'delete') {
          current = {
            type: 'delete',
            position: current.position,
            length: (current.length || 0) + (next.length || 0)
          };
        } else if (current.type === 'retain' && next.type === 'retain') {
          current = {
            type: 'retain',
            position: current.position,
            length: (current.length || 0) + (next.length || 0)
          };
        } else {
          optimized.push(current);
          current = next;
        }
      } else {
        optimized.push(current);
        current = next;
      }
    }
    
    optimized.push(current);
    return optimized;
  }

  /**
   * Calculate delta size in bytes
   */
  private calculateDeltaSize(operations: DeltaOperation[]): number {
    let size = 0;
    
    for (const op of operations) {
      // Add operation metadata size (type, position, length)
      size += 20; // Approximate JSON overhead
      
      if (op.content) {
        size += op.content.length;
      }
    }
    
    return size;
  }

  /**
   * Compress delta for transmission
   * Returns a compact representation of the delta
   */
  compressDelta(delta: Delta): string {
    // Simple JSON serialization
    // In production, could use more efficient binary format
    return JSON.stringify(delta);
  }

  /**
   * Decompress delta
   */
  decompressDelta(compressed: string): Delta {
    return JSON.parse(compressed);
  }

  /**
   * Validate delta integrity
   */
  async validateDelta(
    baseContent: string,
    delta: Delta,
    expectedHash: string
  ): Promise<boolean> {
    try {
      const result = this.applyDelta(baseContent, delta);
      const resultHash = await computeHash(result);
      return resultHash === expectedHash;
    } catch (error) {
      console.error('Delta validation failed:', error);
      return false;
    }
  }

  /**
   * Create delta from file changes
   */
  async createDelta(
    oldContent: string,
    newContent: string
  ): Promise<Delta> {
    const delta = this.computeDelta(oldContent, newContent);
    
    // Compute hashes
    delta.baseHash = await computeHash(oldContent);
    delta.targetHash = await computeHash(newContent);
    
    return delta;
  }

  /**
   * Get delta statistics
   */
  getDeltaStats(delta: Delta): {
    operations: number;
    insertions: number;
    deletions: number;
    retentions: number;
    size: number;
  } {
    const stats = {
      operations: delta.operations.length,
      insertions: 0,
      deletions: 0,
      retentions: 0,
      size: delta.size
    };
    
    for (const op of delta.operations) {
      switch (op.type) {
        case 'insert':
          stats.insertions++;
          break;
        case 'delete':
          stats.deletions++;
          break;
        case 'retain':
          stats.retentions++;
          break;
      }
    }
    
    return stats;
  }
}
