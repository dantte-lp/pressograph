// ═══════════════════════════════════════════════════════════════════
// File Storage Service for Export Files
// ═══════════════════════════════════════════════════════════════════

import { promises as fs } from 'fs';
import path from 'path';
import { generateId } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Storage service for managing exported files (PNG, PDF)
 */
export class StorageService {
  private storagePath: string;
  private maxFileAgeMs: number;

  constructor(storagePath?: string, maxFileAgeHours: number = 24) {
    this.storagePath = storagePath || path.join(process.cwd(), 'exports');
    this.maxFileAgeMs = maxFileAgeHours * 60 * 60 * 1000;
  }

  /**
   * Initialize storage directory
   * Creates storage directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      logger.info(`Storage initialized at: ${this.storagePath}`);
    } catch (error) {
      logger.error('Failed to initialize storage directory', error);
      throw new Error('Storage initialization failed');
    }
  }

  /**
   * Save file buffer to storage
   * @param buffer - File content as Buffer
   * @param extension - File extension (e.g., 'png', 'pdf')
   * @param prefix - Optional filename prefix
   * @returns Saved filename
   */
  async saveFile(buffer: Buffer, extension: string, prefix: string = 'export'): Promise<string> {
    const filename = `${prefix}-${generateId()}.${extension}`;
    const filePath = path.join(this.storagePath, filename);

    try {
      await fs.writeFile(filePath, buffer);
      logger.info(`File saved: ${filename} (${buffer.length} bytes)`);
      return filename;
    } catch (error) {
      logger.error(`Failed to save file: ${filename}`, error);
      throw new Error(`File save failed: ${filename}`);
    }
  }

  /**
   * Read file from storage
   * @param filename - Name of file to read
   * @returns File content as Buffer
   */
  async readFile(filename: string): Promise<Buffer> {
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename');
    }

    const filePath = path.join(this.storagePath, filename);

    try {
      const buffer = await fs.readFile(filePath);
      logger.info(`File read: ${filename} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      logger.error(`Failed to read file: ${filename}`, error);
      throw new Error(`File not found: ${filename}`);
    }
  }

  /**
   * Check if file exists in storage
   * @param filename - Name of file to check
   * @returns True if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }

    const filePath = path.join(this.storagePath, filename);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file from storage
   * @param filename - Name of file to delete
   */
  async deleteFile(filename: string): Promise<void> {
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename');
    }

    const filePath = path.join(this.storagePath, filename);

    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filename}`);
    } catch (error) {
      logger.warn(`Failed to delete file: ${filename}`, error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Clean up old files from storage
   * Deletes files older than maxFileAgeMs
   * @returns Number of files deleted
   */
  async cleanupOldFiles(): Promise<number> {
    try {
      const files = await fs.readdir(this.storagePath);
      const now = Date.now();
      let deletedCount = 0;

      for (const filename of files) {
        const filePath = path.join(this.storagePath, filename);

        try {
          const stats = await fs.stat(filePath);

          // Check if file is older than max age
          if (now - stats.mtimeMs > this.maxFileAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;
            logger.info(`Cleaned up old file: ${filename}`);
          }
        } catch (error) {
          logger.warn(`Failed to process file during cleanup: ${filename}`, error);
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleanup complete: ${deletedCount} files deleted`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   * @returns Storage info (total files, total size in bytes)
   */
  async getStorageInfo(): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.storagePath);
      let totalSize = 0;

      for (const filename of files) {
        try {
          const filePath = path.join(this.storagePath, filename);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          // Skip files that can't be read
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
      };
    } catch (error) {
      logger.error('Failed to get storage info', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}

// Singleton instance
export const storageService = new StorageService(
  process.env.STORAGE_PATH,
  parseInt(process.env.STORAGE_MAX_AGE_HOURS || '24', 10)
);
