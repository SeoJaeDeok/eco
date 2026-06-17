export const MAX_OBSERVATION_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_OBSERVATION_IMAGE_SIZE_MB = MAX_OBSERVATION_IMAGE_SIZE_BYTES / (1024 * 1024);

export const ALLOWED_OBSERVATION_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_OBSERVATION_IMAGE_ACCEPT = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  ...ALLOWED_OBSERVATION_IMAGE_MIME_TYPES,
].join(',');

export type AllowedObservationImageMimeType = typeof ALLOWED_OBSERVATION_IMAGE_MIME_TYPES[number];

export const OBSERVATION_IMAGE_EXTENSIONS_BY_MIME_TYPE: Record<AllowedObservationImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const isAllowedObservationImageMimeType = (mimeType: string): mimeType is AllowedObservationImageMimeType => {
  return Object.prototype.hasOwnProperty.call(OBSERVATION_IMAGE_EXTENSIONS_BY_MIME_TYPE, mimeType);
};
