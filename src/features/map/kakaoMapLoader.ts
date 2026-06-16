const KAKAO_MAP_JAVASCRIPT_KEY_ENV = 'VITE_KAKAO_MAP_JAVASCRIPT_KEY';
const KAKAO_MAP_SDK_SCRIPT_ID = 'kakao-map-sdk';
const KAKAO_MAP_SDK_SRC = 'https://dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_MAP_LOAD_TIMEOUT_MS = 15000;

type ViteImportMeta = ImportMeta & {
  env: Record<string, string | undefined>;
};

export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoLatLngConstructor {
  new(lat: number, lng: number): KakaoLatLng;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
  draggable?: boolean;
  scrollwheel?: boolean;
}

export interface KakaoMapInstance {
  setCenter(position: KakaoLatLng): void;
  setLevel(level: number): void;
  relayout(): void;
}

interface KakaoMapConstructor {
  new(container: HTMLElement, options: KakaoMapOptions): KakaoMapInstance;
}

interface KakaoMarkerOptions {
  map?: KakaoMapInstance | null;
  position: KakaoLatLng;
  title?: string;
  clickable?: boolean;
}

export interface KakaoMarkerInstance {
  setMap(map: KakaoMapInstance | null): void;
  setPosition(position: KakaoLatLng): void;
}

interface KakaoMarkerConstructor {
  new(options: KakaoMarkerOptions): KakaoMarkerInstance;
}

interface KakaoCustomOverlayOptions {
  map?: KakaoMapInstance | null;
  position: KakaoLatLng;
  content: HTMLElement | string;
  clickable?: boolean;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
}

export interface KakaoCustomOverlayInstance {
  setMap(map: KakaoMapInstance | null): void;
  setPosition(position: KakaoLatLng): void;
  setContent(content: HTMLElement | string): void;
}

interface KakaoCustomOverlayConstructor {
  new(options: KakaoCustomOverlayOptions): KakaoCustomOverlayInstance;
}

export interface KakaoMouseEvent {
  latLng: KakaoLatLng;
}

type KakaoEventTarget = KakaoMapInstance | KakaoMarkerInstance | KakaoCustomOverlayInstance;
type KakaoEventHandler = (event: KakaoMouseEvent) => void;

interface KakaoEventNamespace {
  addListener(target: KakaoEventTarget, type: string, handler: KakaoEventHandler): void;
  removeListener(target: KakaoEventTarget, type: string, handler: KakaoEventHandler): void;
}

export interface KakaoMapsNamespace {
  Map: KakaoMapConstructor;
  LatLng: KakaoLatLngConstructor;
  Marker: KakaoMarkerConstructor;
  CustomOverlay: KakaoCustomOverlayConstructor;
  event: KakaoEventNamespace;
  load(callback: () => void): void;
}

type KakaoMapsLoaderNamespace = Partial<KakaoMapsNamespace> & Pick<KakaoMapsNamespace, 'load'>;

interface KakaoSdkNamespace {
  maps: KakaoMapsLoaderNamespace;
}

declare global {
  interface Window {
    kakao?: KakaoSdkNamespace;
  }
}

let kakaoMapLoadPromise: Promise<KakaoMapsNamespace> | null = null;

export const getKakaoMapJavascriptKey = () => {
  return ((import.meta as ViteImportMeta).env[KAKAO_MAP_JAVASCRIPT_KEY_ENV] ?? '').trim();
};

export const hasKakaoMapJavascriptKey = () => getKakaoMapJavascriptKey().length > 0;

const getLoadedKakaoMaps = () => {
  const maps = window.kakao?.maps;
  if (!maps?.Map || !maps.LatLng || typeof maps.load !== 'function') return null;
  return maps as KakaoMapsNamespace;
};

const getKakaoMapsLoader = () => {
  const maps = window.kakao?.maps;
  if (!maps || typeof maps.load !== 'function') return null;
  return maps;
};

const createKakaoMapScriptSrc = (appKey: string) => {
  const params = new URLSearchParams({
    appkey: appKey,
    autoload: 'false',
  });

  return `${KAKAO_MAP_SDK_SRC}?${params.toString()}`;
};

const resolveAfterKakaoMapsLoad = (resolve: (maps: KakaoMapsNamespace) => void, reject: (error: Error) => void) => {
  const maps = getKakaoMapsLoader();
  if (!maps) {
    reject(new Error('Kakao Maps SDK global is unavailable.'));
    return;
  }

  try {
    maps.load(() => {
      const loadedMaps = getLoadedKakaoMaps();
      if (loadedMaps) {
        resolve(loadedMaps);
        return;
      }

      reject(new Error('Kakao Maps SDK did not expose the required map namespace.'));
    });
  } catch {
    reject(new Error('Kakao Maps SDK failed while finalizing load.'));
  }
};

export const loadKakaoMapSdk = (): Promise<KakaoMapsNamespace> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Kakao Maps SDK can only load in a browser environment.'));
  }

  const appKey = getKakaoMapJavascriptKey();
  if (!appKey) {
    return Promise.reject(new Error('Kakao Maps JavaScript key is not configured.'));
  }

  const loadedMaps = getLoadedKakaoMaps();
  if (loadedMaps) {
    return Promise.resolve(loadedMaps);
  }

  if (kakaoMapLoadPromise) {
    return kakaoMapLoadPromise;
  }

  kakaoMapLoadPromise = new Promise<KakaoMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SDK_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };

    const settleReject = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      kakaoMapLoadPromise = null;
      reject(error);
    };

    const settleResolve = (maps: KakaoMapsNamespace) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(maps);
    };

    const handleLoad = () => {
      resolveAfterKakaoMapsLoad(settleResolve, settleReject);
    };

    const handleError = () => {
      settleReject(new Error('Kakao Maps SDK script failed to load.'));
    };

    const timeoutId = window.setTimeout(() => {
      settleReject(new Error('Kakao Maps SDK load timed out.'));
    }, KAKAO_MAP_LOAD_TIMEOUT_MS);

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    if (existingScript && getKakaoMapsLoader()) {
      handleLoad();
      return;
    }

    if (!existingScript) {
      script.id = KAKAO_MAP_SDK_SCRIPT_ID;
      script.async = true;
      script.src = createKakaoMapScriptSrc(appKey);
      document.head.appendChild(script);
    }
  });

  return kakaoMapLoadPromise;
};
