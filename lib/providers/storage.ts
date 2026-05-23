import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface SaveFileInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface SavedFile {
  path: string;
  url: string;
  sizeBytes: number;
}

export interface StorageProvider {
  readonly name: string;
  save(input: SaveFileInput): Promise<SavedFile>;
}

export const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR ?? "./storage/uploads",
);

function safeName(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${randomUUID()}${ext}`;
}

// Adaptador local: grava em UPLOAD_DIR e serve via /api/files/[name].
class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  async save(input: SaveFileInput): Promise<SavedFile> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = safeName(input.filename);
    const fullPath = path.join(UPLOAD_DIR, name);
    await writeFile(fullPath, input.buffer);
    return {
      path: name,
      url: `/api/files/${name}`,
      sizeBytes: input.buffer.byteLength,
    };
  }
}

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;
  // Espaço para plugar S3 conforme STORAGE_PROVIDER.
  instance = new LocalStorageProvider();
  return instance;
}
