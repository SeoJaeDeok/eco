import { useEffect, useMemo, useRef, useState } from 'react';
import { getTaxonColor } from '../../constants/taxon';
import type { Coordinates, Observation } from '../../types';
import { StaticEcoMap } from '../../components/map/StaticEcoMap';
import { StaticLocationPicker } from '../../components/map/StaticLocationPicker';
import { StaticPositionPreview } from '../../components/map/StaticPositionPreview';
import { DEFAULT_MAP_CENTER } from './mapProjection';
import type { EcoLocationPickerProps, EcoMapProps, MapProviderAdapter, StaticPositionPreviewProps } from './mapTypes';
import {
  hasKakaoMapJavascriptKey,
  loadKakaoMapSdk,
  type KakaoCustomOverlayInstance,
  type KakaoMapInstance,
  type KakaoMapsNamespace,
  type KakaoMarkerInstance,
  type KakaoMouseEvent,
} from './kakaoMapLoader';

const DEFAULT_KAKAO_LEVEL = 4;
const KAKAO_MAP_LOADING_MESSAGE = '카카오 지도를 불러오는 중입니다.';
const KAKAO_PICKER_LOADING_MESSAGE = '카카오 위치 선택 지도를 불러오는 중입니다.';
const KAKAO_PREVIEW_LOADING_MESSAGE = '관찰 위치 지도를 불러오는 중입니다.';

type KakaoLoadStatus = 'loading' | 'ready' | 'fallback';

interface ObservationOverlayHandle {
  overlay: KakaoCustomOverlayInstance;
  cleanup: () => void;
}

const isValidCoordinates = (coords: Coordinates) => Number.isFinite(coords.lat) && Number.isFinite(coords.lng);

const getRootClassName = (className?: string) => {
  return className
    ? `relative w-full h-full overflow-hidden bg-zinc-100 ${className}`
    : 'relative w-full h-full overflow-hidden bg-zinc-100';
};

const getLocationPickerClassName = (className?: string) => {
  return className
    ? `w-full h-full border border-zinc-200 relative overflow-hidden bg-zinc-50 cursor-crosshair ${className}`
    : 'w-full h-full border border-zinc-200 relative overflow-hidden bg-zinc-50 cursor-crosshair';
};

const KakaoLoadingNotice = ({ message }: { message: string }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/90">
      <div className="border border-zinc-200 bg-white/90 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400 shadow-sm">
        {message}
      </div>
    </div>
  );
};

const createLatLng = (maps: KakaoMapsNamespace, coords: Coordinates) => {
  return new maps.LatLng(coords.lat, coords.lng);
};

const createCoordinates = (event: KakaoMouseEvent): Coordinates => {
  return {
    lat: event.latLng.getLat(),
    lng: event.latLng.getLng(),
  };
};

const getMapLevel = (zoom?: number) => {
  if (!Number.isFinite(zoom)) return DEFAULT_KAKAO_LEVEL;
  return Math.max(1, Math.min(14, Math.round(Number(zoom))));
};

const getMapCenter = (observations: Observation[], center?: Coordinates) => {
  if (center && isValidCoordinates(center)) return center;
  return observations.find((observation) => isValidCoordinates(observation.coords))?.coords ?? DEFAULT_MAP_CENTER;
};

const createObservationMarkerContent = (
  observation: Observation,
  isSelected: boolean,
  onSelectObservation?: (observation: Observation) => void,
) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = observation.name;
  button.setAttribute('aria-label', `${observation.name} 관찰 지점 선택`);
  button.style.position = 'relative';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.gap = '6px';
  button.style.minWidth = '36px';
  button.style.minHeight = '36px';
  button.style.margin = '-8px';
  button.style.padding = '8px';
  button.style.border = '0';
  button.style.background = 'transparent';
  button.style.cursor = onSelectObservation ? 'pointer' : 'default';
  button.style.touchAction = 'manipulation';

  const dot = document.createElement('span');
  dot.style.display = 'block';
  dot.style.width = isSelected ? '22px' : '18px';
  dot.style.height = isSelected ? '22px' : '18px';
  dot.style.borderRadius = '9999px';
  dot.style.border = isSelected ? '2px solid #18181b' : '2px solid #ffffff';
  dot.style.backgroundColor = getTaxonColor(observation.taxon);
  dot.style.boxShadow = '0 4px 12px rgba(24, 24, 27, 0.2)';
  dot.style.transition = 'transform 160ms ease';

  const label = document.createElement('span');
  label.textContent = observation.name;
  label.setAttribute('aria-hidden', 'true');
  label.style.whiteSpace = 'nowrap';
  label.style.background = 'rgba(255, 255, 255, 0.92)';
  label.style.border = '1px solid rgba(244, 244, 245, 1)';
  label.style.padding = '4px 8px';
  label.style.fontSize = '10px';
  label.style.lineHeight = '1';
  label.style.color = '#3f3f46';
  label.style.boxShadow = '0 4px 10px rgba(24, 24, 27, 0.08)';
  label.style.opacity = isSelected ? '1' : '0';
  label.style.transition = 'opacity 160ms ease';
  label.style.pointerEvents = 'none';

  const showLabel = () => {
    label.style.opacity = '1';
    dot.style.transform = 'scale(1.35)';
  };

  const hideLabel = () => {
    label.style.opacity = isSelected ? '1' : '0';
    dot.style.transform = 'scale(1)';
  };

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onSelectObservation?.(observation);
  };

  button.addEventListener('mouseenter', showLabel);
  button.addEventListener('focus', showLabel);
  button.addEventListener('mouseleave', hideLabel);
  button.addEventListener('blur', hideLabel);
  button.addEventListener('click', handleClick);
  button.append(dot, label);

  return {
    element: button,
    cleanup: () => {
      button.removeEventListener('mouseenter', showLabel);
      button.removeEventListener('focus', showLabel);
      button.removeEventListener('mouseleave', hideLabel);
      button.removeEventListener('blur', hideLabel);
      button.removeEventListener('click', handleClick);
    },
  };
};

const createPositionMarkerContent = (color: string) => {
  const marker = document.createElement('span');
  marker.setAttribute('aria-hidden', 'true');
  marker.style.display = 'block';
  marker.style.width = '16px';
  marker.style.height = '16px';
  marker.style.borderRadius = '9999px';
  marker.style.border = '2px solid #ffffff';
  marker.style.backgroundColor = color;
  marker.style.boxShadow = '0 4px 12px rgba(24, 24, 27, 0.2)';
  return marker;
};

const clearObservationOverlays = (overlays: ObservationOverlayHandle[]) => {
  overlays.forEach(({ overlay, cleanup }) => {
    overlay.setMap(null);
    cleanup();
  });
};

const KakaoEcoMap = ({
  observations,
  selectedObservationId,
  center,
  zoom,
  onSelectObservation,
  onMapClick,
  className,
}: EcoMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapsRef = useRef<KakaoMapsNamespace | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const overlaysRef = useRef<ObservationOverlayHandle[]>([]);
  const mapClickCleanupRef = useRef<(() => void) | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const [status, setStatus] = useState<KakaoLoadStatus>(() => (hasKakaoMapJavascriptKey() ? 'loading' : 'fallback'));
  const mapCenter = useMemo(() => getMapCenter(observations, center), [center, observations]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!hasKakaoMapJavascriptKey()) {
      setStatus('fallback');
      return;
    }

    let isCurrent = true;

    const initializeMap = async () => {
      try {
        const maps = await loadKakaoMapSdk();
        if (!isCurrent || !containerRef.current) return;

        mapsRef.current = maps;
        const map = new maps.Map(containerRef.current, {
          center: createLatLng(maps, mapCenter),
          level: getMapLevel(zoom),
        });
        mapRef.current = map;

        const handleMapClick = (event: KakaoMouseEvent) => {
          onMapClickRef.current?.(createCoordinates(event));
        };
        maps.event.addListener(map, 'click', handleMapClick);
        mapClickCleanupRef.current = () => maps.event.removeListener(map, 'click', handleMapClick);

        window.setTimeout(() => map.relayout(), 0);
        setStatus('ready');
      } catch {
        if (isCurrent) setStatus('fallback');
      }
    };

    void initializeMap();

    return () => {
      isCurrent = false;
      mapClickCleanupRef.current?.();
      mapClickCleanupRef.current = null;
      clearObservationOverlays(overlaysRef.current);
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map || status !== 'ready') return;

    map.setCenter(createLatLng(maps, mapCenter));
    map.setLevel(getMapLevel(zoom));
    window.setTimeout(() => map.relayout(), 0);
  }, [mapCenter, status, zoom]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map || status !== 'ready') return;

    clearObservationOverlays(overlaysRef.current);
    overlaysRef.current = observations
      .filter((observation) => isValidCoordinates(observation.coords))
      .map((observation) => {
        const { element, cleanup } = createObservationMarkerContent(
          observation,
          observation.id === selectedObservationId,
          onSelectObservation,
        );
        const overlay = new maps.CustomOverlay({
          map,
          position: createLatLng(maps, observation.coords),
          content: element,
          clickable: true,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: observation.id === selectedObservationId ? 20 : 10,
        });

        return { overlay, cleanup };
      });
  }, [observations, onSelectObservation, selectedObservationId, status]);

  if (status === 'fallback') {
    return (
      <StaticEcoMap
        observations={observations}
        selectedObservationId={selectedObservationId}
        center={center}
        zoom={zoom}
        onSelectObservation={onSelectObservation}
        onMapClick={onMapClick}
        className={className}
      />
    );
  }

  return (
    <div className={getRootClassName(className)} aria-label="Kakao map" role={status === 'loading' ? 'status' : undefined}>
      <div ref={containerRef} className="absolute inset-0" />
      {status === 'loading' && <KakaoLoadingNotice message={KAKAO_MAP_LOADING_MESSAGE} />}
    </div>
  );
};

const KakaoLocationPicker = ({ value, center = DEFAULT_MAP_CENTER, onChange, className }: EcoLocationPickerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapsRef = useRef<KakaoMapsNamespace | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRef = useRef<KakaoMarkerInstance | null>(null);
  const mapClickCleanupRef = useRef<(() => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const [coords, setCoords] = useState<Coordinates | null>(value ?? null);
  const [status, setStatus] = useState<KakaoLoadStatus>(() => (hasKakaoMapJavascriptKey() ? 'loading' : 'fallback'));
  const initialCenter = value ?? center;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setCoords(value ?? null);
  }, [value]);

  useEffect(() => {
    if (!hasKakaoMapJavascriptKey()) {
      setStatus('fallback');
      return;
    }

    let isCurrent = true;

    const initializeMap = async () => {
      try {
        const maps = await loadKakaoMapSdk();
        if (!isCurrent || !containerRef.current) return;

        mapsRef.current = maps;
        const map = new maps.Map(containerRef.current, {
          center: createLatLng(maps, initialCenter),
          level: DEFAULT_KAKAO_LEVEL,
        });
        mapRef.current = map;

        if (value) {
          markerRef.current = new maps.Marker({
            map,
            position: createLatLng(maps, value),
            clickable: false,
          });
        }

        const handleMapClick = (event: KakaoMouseEvent) => {
          const next = createCoordinates(event);
          setCoords(next);
          onChangeRef.current(next);

          if (!markerRef.current) {
            markerRef.current = new maps.Marker({
              map,
              position: createLatLng(maps, next),
              clickable: false,
            });
            return;
          }

          markerRef.current.setPosition(createLatLng(maps, next));
        };

        maps.event.addListener(map, 'click', handleMapClick);
        mapClickCleanupRef.current = () => maps.event.removeListener(map, 'click', handleMapClick);

        window.setTimeout(() => map.relayout(), 0);
        setStatus('ready');
      } catch {
        if (isCurrent) setStatus('fallback');
      }
    };

    void initializeMap();

    return () => {
      isCurrent = false;
      mapClickCleanupRef.current?.();
      mapClickCleanupRef.current = null;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map || !value || status !== 'ready') return;

    const position = createLatLng(maps, value);
    markerRef.current?.setPosition(position);
    map.setCenter(position);
  }, [status, value]);

  if (status === 'fallback') {
    return <StaticLocationPicker value={value} center={center} onChange={onChange} className={className} />;
  }

  return (
    <div className={getLocationPickerClassName(className)} aria-label="Kakao location picker" role={status === 'loading' ? 'status' : undefined}>
      <div ref={containerRef} className="absolute inset-0" />
      {status === 'loading' && <KakaoLoadingNotice message={KAKAO_PICKER_LOADING_MESSAGE} />}
      {coords && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 border border-zinc-200 text-[8px] opacity-60 z-10 pointer-events-none">
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

const KakaoPositionPreview = ({ coordinates, taxon }: StaticPositionPreviewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapsRef = useRef<KakaoMapsNamespace | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const overlayRef = useRef<KakaoCustomOverlayInstance | null>(null);
  const [status, setStatus] = useState<KakaoLoadStatus>(() => (hasKakaoMapJavascriptKey() ? 'loading' : 'fallback'));

  useEffect(() => {
    if (!hasKakaoMapJavascriptKey()) {
      setStatus('fallback');
      return;
    }

    let isCurrent = true;

    const initializeMap = async () => {
      try {
        const maps = await loadKakaoMapSdk();
        if (!isCurrent || !containerRef.current) return;

        mapsRef.current = maps;
        const position = createLatLng(maps, coordinates);
        const map = new maps.Map(containerRef.current, {
          center: position,
          level: DEFAULT_KAKAO_LEVEL,
          draggable: false,
          scrollwheel: false,
        });
        mapRef.current = map;
        overlayRef.current = new maps.CustomOverlay({
          map,
          position,
          content: createPositionMarkerContent(getTaxonColor(taxon ?? '기타')),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 20,
        });

        window.setTimeout(() => map.relayout(), 0);
        setStatus('ready');
      } catch {
        if (isCurrent) setStatus('fallback');
      }
    };

    void initializeMap();

    return () => {
      isCurrent = false;
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!maps || !map || !overlay || status !== 'ready') return;

    const position = createLatLng(maps, coordinates);
    map.setCenter(position);
    overlay.setPosition(position);
  }, [coordinates, status]);

  if (status === 'fallback') {
    return <StaticPositionPreview coordinates={coordinates} taxon={taxon} />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-100" aria-label="Kakao position preview" role={status === 'loading' ? 'status' : undefined}>
      <div ref={containerRef} className="absolute inset-0" />
      {status === 'loading' && <KakaoLoadingNotice message={KAKAO_PREVIEW_LOADING_MESSAGE} />}
    </div>
  );
};

export const kakaoMapProvider: MapProviderAdapter = {
  kind: 'kakao',
  EcoMap: KakaoEcoMap,
  LocationPicker: KakaoLocationPicker,
  PositionPreview: KakaoPositionPreview,
};
