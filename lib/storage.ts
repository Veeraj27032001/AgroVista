import 'server-only';
import { getStorageAdapter } from './adapters/storage';
import { config } from './config';

const SIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes, per the plan's signed-URL strategy

export async function ensureBuckets(): Promise<void> {
  const storage = getStorageAdapter();
  await storage.ensureBucket(config.storageBuckets.posters, true);
  await storage.ensureBucket(config.storageBuckets.issuePdfs, false);
  await storage.ensureBucket(config.storageBuckets.submissionFiles, false);
  await storage.ensureBucket(config.storageBuckets.adminEdits, false);
}

export async function uploadPoster(issueId: string, file: Buffer, contentType: string): Promise<string> {
  const storage = getStorageAdapter();
  const path = `${issueId}/poster-${Date.now()}`;
  await storage.upload(config.storageBuckets.posters, path, file, contentType);
  return storage.getPublicUrl(config.storageBuckets.posters, path);
}

export async function uploadIssuePdf(issueId: string, file: Buffer, contentType: string): Promise<string> {
  const storage = getStorageAdapter();
  const path = `${issueId}.pdf`;
  await storage.upload(config.storageBuckets.issuePdfs, path, file, contentType);
  return path;
}

export async function getIssuePdfSignedUrl(pdfStoragePath: string): Promise<string> {
  return getStorageAdapter().getSignedUrl(config.storageBuckets.issuePdfs, pdfStoragePath, SIGNED_URL_TTL_SECONDS);
}

export async function uploadSubmissionFile(
  submissionId: string,
  versionNumber: number,
  kind: 'word' | 'pdf',
  file: Buffer,
  contentType: string
): Promise<string> {
  const storage = getStorageAdapter();
  const ext = kind === 'word' ? 'docx' : 'pdf';
  const path = `${submissionId}/v${versionNumber}/${kind}.${ext}`;
  await storage.upload(config.storageBuckets.submissionFiles, path, file, contentType);
  return path;
}

export async function uploadAdminEditFile(
  submissionId: string,
  kind: 'word' | 'pdf',
  file: Buffer,
  contentType: string
): Promise<string> {
  const storage = getStorageAdapter();
  const ext = kind === 'word' ? 'docx' : 'pdf';
  const path = `${submissionId}/${kind}-${Date.now()}.${ext}`;
  await storage.upload(config.storageBuckets.adminEdits, path, file, contentType);
  return path;
}

export async function getSubmissionFileSignedUrl(path: string): Promise<string> {
  return getStorageAdapter().getSignedUrl(config.storageBuckets.submissionFiles, path, SIGNED_URL_TTL_SECONDS);
}

export async function getAdminEditFileSignedUrl(path: string): Promise<string> {
  return getStorageAdapter().getSignedUrl(config.storageBuckets.adminEdits, path, SIGNED_URL_TTL_SECONDS);
}
