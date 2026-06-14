import type { MapProviderKind } from './mapTypes';

export const ACTIVE_MAP_PROVIDER: MapProviderKind = 'static';

export const getActiveMapProviderKind = (): MapProviderKind => ACTIVE_MAP_PROVIDER;
