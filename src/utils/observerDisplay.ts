import type { Observation } from '../types';

export const DEFAULT_OBSERVER_DISPLAY_NAME = '등록 관찰자';

const EMAIL_LIKE_DISPLAY_NAME_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeObserverDisplayName = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue || EMAIL_LIKE_DISPLAY_NAME_PATTERN.test(trimmedValue)) {
    return undefined;
  }

  return trimmedValue;
};

export const getObservationObserverDisplayName = (
  observation: Pick<Observation, 'observerDisplayName'>,
) => {
  return normalizeObserverDisplayName(observation.observerDisplayName) ?? DEFAULT_OBSERVER_DISPLAY_NAME;
};
