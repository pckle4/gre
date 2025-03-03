import { files, type File, type InsertFile } from "@shared/schema";

export interface IStorage {
  createFile(file: InsertFile): Promise<File>;
  getFile(fileId: string): Promise<File | undefined>;
  markAsDownloaded(fileId: string): Promise<void>;
  incrementDownloadCount(fileId: string): Promise<void>;
  getFileMetrics(fileId: string): Promise<{
    totalDownloads: number;
    downloadTime: string | null;
    uploadTime: string;
  }>;
}

export class MemStorage implements IStorage {
  private files: Map<string, File>;
  private currentId: number;

  constructor() {
    this.files = new Map();
    this.currentId = 1;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentId++;
    const file: File = { 
      ...insertFile, 
      id, 
      downloaded: false,
      downloadCount: 0
    };
    this.files.set(insertFile.fileId, file);
    return file;
  }

  async getFile(fileId: string): Promise<File | undefined> {
    return this.files.get(fileId);
  }

  async markAsDownloaded(fileId: string): Promise<void> {
    const file = this.files.get(fileId);
    if (file) {
      file.downloaded = true;
      this.files.set(fileId, file);
    }
  }

  async incrementDownloadCount(fileId: string): Promise<void> {
    const file = this.files.get(fileId);
    if (file) {
      file.downloadCount = (file.downloadCount || 0) + 1;
      this.files.set(fileId, file);
    }
  }

  async getFileMetrics(fileId: string): Promise<{
    totalDownloads: number;
    downloadTime: string | null;
    uploadTime: string;
  }> {
    const file = this.files.get(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    return {
      totalDownloads: file.downloadCount || 0,
      downloadTime: file.downloaded ? new Date().toISOString() : null,
      uploadTime: file.uploadTime
    };
  }
}

export const storage = new MemStorage();