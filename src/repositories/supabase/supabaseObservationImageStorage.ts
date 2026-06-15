import { getSupabaseClient } from './supabaseClient';

const OBSERVATION_IMAGE_BUCKET_ENV_KEY = 'VITE_SUPABASE_STORAGE_BUCKET';
const DEFAULT_OBSERVATION_IMAGE_BUCKET = 'observation-images';
const MAX_OBSERVATION_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS = 10 * 60;

const ALLOWED_IMAGE_EXTENSIONS_BY_MIME_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type AllowedObservationImageMimeType = keyof typeof ALLOWED_IMAGE_EXTENSIONS_BY_MIME_TYPE;

type ViteImportMeta = ImportMeta & {
  env: Record<string, string | undefined>;
};

export interface UploadedObservationImage {
  path: string;
  mimeType: AllowedObservationImageMimeType;
  sizeBytes: number;
}

const createStorageError = (message: string, cause?: unknown) => {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
};

const getObservationImageBucket = () => {
  return (
    (import.meta as ViteImportMeta).env[OBSERVATION_IMAGE_BUCKET_ENV_KEY]?.trim()
    || DEFAULT_OBSERVATION_IMAGE_BUCKET
  );
};

const isAllowedObservationImageMimeType = (mimeType: string): mimeType is AllowedObservationImageMimeType => {
  return Object.prototype.hasOwnProperty.call(ALLOWED_IMAGE_EXTENSIONS_BY_MIME_TYPE, mimeType);
};

const createUuid = () => {
  const globalCrypto = globalThis.crypto;

  if (typeof globalCrypto?.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = token === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
};

const getValidatedObservationImageMimeType = (file: File): AllowedObservationImageMimeType => {
  if (!isAllowedObservationImageMimeType(file.type)) {
    throw createStorageError('Unsupported observation image type. Use JPEG, PNG, or WebP.');
  }

  return file.type;
};

const validateObservationImageSize = (file: File) => {
  if (file.size > MAX_OBSERVATION_IMAGE_SIZE_BYTES) {
    throw createStorageError('Observation image is larger than the 5 MB limit.');
  }
};

const createObservationImagePath = (mimeType: AllowedObservationImageMimeType) => {
  const clientGeneratedId = createUuid();
  const randomId = createUuid();
  const extension = ALLOWED_IMAGE_EXTENSIONS_BY_MIME_TYPE[mimeType];

  return `pending/${clientGeneratedId}/${randomId}.${extension}`;
};

export const uploadObservationImage = async (file: File): Promise<UploadedObservationImage> => {
  const mimeType = getValidatedObservationImageMimeType(file);
  validateObservationImageSize(file);

  const path = createObservationImagePath(mimeType);
  const { error } = await getSupabaseClient()
    .storage
    .from(getObservationImageBucket())
    .upload(path, file, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw createStorageError('Failed to upload observation image to Supabase Storage.', error);
  }

  return {
    path,
    mimeType,
    sizeBytes: file.size,
  };
};

export const createObservationImageSignedUrl = async (
  path: string,
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS,
): Promise<string> => {
  const normalizedPath = path.trim();

  if (!normalizedPath) {
    throw createStorageError('Observation image path is required.');
  }

  const { data, error } = await getSupabaseClient()
    .storage
    .from(getObservationImageBucket())
    .createSignedUrl(normalizedPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw createStorageError('Failed to create signed observation image URL.');
  }

  return data.signedUrl;
};

export const resolveObservationImageSignedUrl = async (
  path: string | null | undefined,
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS,
): Promise<string | null> => {
  if (!path?.trim()) {
    return null;
  }

  try {
    return await createObservationImageSignedUrl(path, expiresInSeconds);
  } catch {
    return null;
  }
};
