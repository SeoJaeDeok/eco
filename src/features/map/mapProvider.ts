import { StaticEcoMap } from '../../components/map/StaticEcoMap';
import { StaticLocationPicker } from '../../components/map/StaticLocationPicker';
import { StaticPositionPreview } from '../../components/map/StaticPositionPreview';
import { hasKakaoMapJavascriptKey } from './kakaoMapLoader';
import { kakaoMapProvider } from './kakaoMapProvider';
import type { MapProviderAdapter, MapProviderKind } from './mapTypes';

const staticMapProvider: MapProviderAdapter = {
  kind: 'static',
  EcoMap: StaticEcoMap,
  LocationPicker: StaticLocationPicker,
  PositionPreview: StaticPositionPreview,
};

export const getActiveMapProviderKind = (): MapProviderKind => {
  return hasKakaoMapJavascriptKey() ? 'kakao' : 'static';
};

export const getActiveMapProvider = (): MapProviderAdapter => {
  return getActiveMapProviderKind() === 'kakao' ? kakaoMapProvider : staticMapProvider;
};
