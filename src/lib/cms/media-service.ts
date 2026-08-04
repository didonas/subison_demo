import crypto from "crypto";
import { env } from "@/lib/env";

export interface StoredMedia {
  storageKey: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface UploadInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  altTextEn?: string;
  altTextTa?: string;
}

export interface MediaStorageProvider {
  upload(input: UploadInput): Promise<StoredMedia>;
  delete(storageKey: string): Promise<void>;
  getPublicUrl(storageKey: string): string;
  getThumbnailUrl(storageKey: string, width?: number, height?: number): string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
]);

const PROHIBITED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "php", "js", "ts", "py", "pl", "cgi", "bin", "dll", "vbs", "ps1", "svg", "html", "htm", "xml"
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateUploadedMedia(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): { isValid: boolean; error?: string } {
  // 1. Check file size
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return { isValid: false, error: `File size exceeds 5MB maximum limit (${(buffer.length / (1024 * 1024)).toFixed(2)}MB)` };
  }

  if (buffer.length === 0) {
    return { isValid: false, error: "File is empty" };
  }

  // 2. Check extension
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (PROHIBITED_EXTENSIONS.has(ext)) {
    return { isValid: false, error: `File type .${ext} is prohibited for security reasons` };
  }

  // 3. Check declared MIME type
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { isValid: false, error: `Unsupported MIME type: ${mimeType}. Allowed: JPEG, PNG, WebP, AVIF, PDF.` };
  }

  // 4. Validate magic byte signatures
  if (!validateMagicBytes(buffer, mimeType)) {
    return { isValid: false, error: "File binary header does not match declared MIME type" };
  }

  return { isValid: true };
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47
  if (mimeType === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // WebP: RIFF ... WEBP (52 49 46 46)
  if (mimeType === "image/webp") {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  // AVIF: ....ftypavif or ftypavis
  if (mimeType === "image/avif") {
    if (buffer.length >= 12) {
      const ftyp = buffer.toString("ascii", 4, 8);
      const brand = buffer.toString("ascii", 8, 12);
      return ftyp === "ftyp" && (brand === "avif" || brand === "avis" || brand === "mif1");
    }
  }

  // PDF: %PDF (25 50 44 46)
  if (mimeType === "application/pdf") {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  return false;
}

export class LocalMediaStorageProvider implements MediaStorageProvider {
  private basePublicUrl: string;

  constructor(basePublicUrl: string = "/uploads") {
    this.basePublicUrl = basePublicUrl;
  }

  async upload(input: UploadInput): Promise<StoredMedia> {
    const validation = validateUploadedMedia(input.buffer, input.fileName, input.mimeType);
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid media upload");
    }

    const ext = input.fileName.split(".").pop()?.toLowerCase() || "webp";
    const randomHash = crypto.randomBytes(16).toString("hex");
    const storageKey = `media_${Date.now()}_${randomHash}.${ext}`;
    const publicUrl = `${this.basePublicUrl}/${storageKey}`;

    return {
      storageKey,
      publicUrl,
      fileName: input.fileName,
      fileSize: input.buffer.length,
      mimeType: input.mimeType,
      thumbnailUrl: publicUrl,
    };
  }

  async delete(_storageKey: string): Promise<void> {
    void _storageKey;
    return Promise.resolve();
  }

  getPublicUrl(storageKey: string): string {
    return `${this.basePublicUrl}/${storageKey}`;
  }

  getThumbnailUrl(storageKey: string): string {
    return `${this.basePublicUrl}/${storageKey}`;
  }
}

export class CloudinaryMediaStorageProvider implements MediaStorageProvider {
  private cloudName: string;

  constructor(cloudName: string = "subison-neuro") {
    this.cloudName = cloudName;
  }

  async upload(input: UploadInput): Promise<StoredMedia> {
    const validation = validateUploadedMedia(input.buffer, input.fileName, input.mimeType);
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid media upload");
    }

    const ext = input.fileName.split(".").pop()?.toLowerCase() || "webp";
    const randomHash = crypto.randomBytes(16).toString("hex");
    const storageKey = `hospital/cms/${Date.now()}_${randomHash}.${ext}`;
    const publicUrl = this.getPublicUrl(storageKey);
    const thumbnailUrl = this.getThumbnailUrl(storageKey, 300, 300);

    return {
      storageKey,
      publicUrl,
      fileName: input.fileName,
      fileSize: input.buffer.length,
      mimeType: input.mimeType,
      thumbnailUrl,
    };
  }

  async delete(_storageKey: string): Promise<void> {
    void _storageKey;
    return Promise.resolve();
  }

  getPublicUrl(storageKey: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/q_auto,f_auto/${storageKey}`;
  }

  getThumbnailUrl(storageKey: string, width: number = 300, height: number = 300): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${storageKey}`;
  }
}

export const mediaStorage: MediaStorageProvider = 
  env.STORAGE_PROVIDER === "cloudinary" 
    ? new CloudinaryMediaStorageProvider()
    : new LocalMediaStorageProvider();
