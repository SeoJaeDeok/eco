import type { Observation } from '../types';

const PREFETCHED_IMAGE_TTL_MS = 9 * 60 * 1000;
const DEFAULT_PREFETCH_LIMIT = 24;
const DEFAULT_PREFETCH_CONCURRENCY = 4;
const MAX_PREFETCH_CACHE_ENTRIES = 48;

interface PrefetchedObservationImage {
  imageUrl: string;
  expiresAt: number;
  promise?: Promise<void>;
}

const prefetchedImagesByKey = new Map<string, PrefetchedObservationImage>();

const getObservationImageCacheKey = (observation: Pick<Observation, 'id' | 'imagePath'>) => {
  return observation.imagePath ? `${observation.id}:${observation.imagePath}` : null;
};

const isUsablePrefetchEntry = (entry: PrefetchedObservationImage | undefined) => {
  return Boolean(entry && entry.expiresAt > Date.now());
};

const deleteExpiredPrefetchEntries = () => {
  const now = Date.now();

  prefetchedImagesByKey.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      prefetchedImagesByKey.delete(key);
    }
  });
};

const enforcePrefetchCacheLimit = () => {
  deleteExpiredPrefetchEntries();

  while (prefetchedImagesByKey.size > MAX_PREFETCH_CACHE_ENTRIES) {
    const oldestCacheKey = prefetchedImagesByKey.keys().next().value;

    if (!oldestCacheKey) {
      return;
    }

    prefetchedImagesByKey.delete(oldestCacheKey);
  }
};

const canPreloadImages = () => {
  return typeof window !== 'undefined' && typeof Image !== 'undefined';
};

const preloadImageUrl = (imageUrl: string) => {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Observation image preload failed.'));
    image.src = imageUrl;
  });
};

export const getCachedObservationImageUrl = (observation: Pick<Observation, 'id' | 'imagePath'>) => {
  const cacheKey = getObservationImageCacheKey(observation);
  if (!cacheKey) return undefined;

  deleteExpiredPrefetchEntries();
  const cachedImage = prefetchedImagesByKey.get(cacheKey);

  if (!isUsablePrefetchEntry(cachedImage)) {
    prefetchedImagesByKey.delete(cacheKey);
    return undefined;
  }

  return cachedImage?.imageUrl;
};

export const withCachedObservationImageUrl = (observation: Observation): Observation => {
  const cachedImageUrl = getCachedObservationImageUrl(observation);
  return cachedImageUrl ? { ...observation, imageUrl: cachedImageUrl } : observation;
};

export const invalidateObservationImageCache = (observation: Pick<Observation, 'id' | 'imagePath'>) => {
  const cacheKey = getObservationImageCacheKey(observation);
  if (cacheKey) {
    prefetchedImagesByKey.delete(cacheKey);
  }
};

export const prefetchObservationImage = (observation: Observation) => {
  const cacheKey = getObservationImageCacheKey(observation);

  if (!cacheKey || !observation.imageUrl.trim() || !canPreloadImages()) {
    return Promise.resolve();
  }

  const cachedImage = prefetchedImagesByKey.get(cacheKey);

  if (isUsablePrefetchEntry(cachedImage)) {
    return cachedImage?.promise ?? Promise.resolve();
  }

  if (cachedImage) {
    prefetchedImagesByKey.delete(cacheKey);
  }

  const expiresAt = Date.now() + PREFETCHED_IMAGE_TTL_MS;
  const promise = preloadImageUrl(observation.imageUrl)
    .catch((error: unknown) => {
      prefetchedImagesByKey.delete(cacheKey);
      throw error;
    });

  prefetchedImagesByKey.set(cacheKey, {
    imageUrl: observation.imageUrl,
    expiresAt,
    promise,
  });
  enforcePrefetchCacheLimit();

  return promise;
};

export const prefetchObservationImages = async (
  observations: Observation[],
  options: { limit?: number; concurrency?: number } = {},
) => {
  const limit = options.limit ?? DEFAULT_PREFETCH_LIMIT;
  const concurrency = options.concurrency ?? DEFAULT_PREFETCH_CONCURRENCY;
  const candidates = observations
    .filter((observation) => observation.imagePath && observation.imageUrl.trim())
    .slice(0, limit);

  for (let index = 0; index < candidates.length; index += concurrency) {
    const batch = candidates.slice(index, index + concurrency);
    await Promise.all(batch.map((observation) => prefetchObservationImage(observation).catch(() => undefined)));
  }
};
