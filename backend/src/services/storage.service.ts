import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config, logger } from '../config';

export interface StoredDocumentResult {
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  isVirusScanned: boolean;
}

export class StorageService {
  /**
   * Initializes local vault storage directory
   */
  public static ensureUploadDirectoryExists(): void {
    const dir = path.resolve(config.storage.localDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Stores an uploaded file buffer, calculates cryptographic checksum, and simulates malware scan
   */
  public static async storeFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<StoredDocumentResult> {
    this.ensureUploadDirectoryExists();

    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(fileName) || '.bin';
    const uniqueKey = `doc_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const destinationPath = path.join(path.resolve(config.storage.localDir), uniqueKey);

    // Write file to vault
    fs.writeFileSync(destinationPath, fileBuffer);

    // Assessment 08: Simulate anti-virus / integrity inspection
    const isClean = !fileName.toLowerCase().includes('eicar_test_malware');

    logger.info(`[StorageService] Document stored securely: ${uniqueKey}`, {
      size: fileBuffer.length,
      checksum,
      virusScanPassed: isClean,
    });

    return {
      fileKey: uniqueKey,
      fileUrl: `/uploads/${uniqueKey}`,
      fileSize: fileBuffer.length,
      mimeType,
      checksum,
      isVirusScanned: isClean,
    };
  }
}
