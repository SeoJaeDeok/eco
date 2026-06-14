import { useEffect, useRef, useState } from 'react';
import { Plus, Minus } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

const KNU_CENTER = { lat: 35.8898, lng: 128.6106 };

export const MainKakaoMap = ({ observations = [], onSelect }: { observations?: Observation[], onSelect?: (obs: Observation) => void }) => {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  // Initialize Map once
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.Map || !window.kakao.maps.LatLng || !container.current) return;
    if (mapRef.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(KNU_CENTER.lat, KNU_CENTER.lng),
      level: 4,
    };

    mapRef.current = new window.kakao.maps.Map(container.current, options);
  }, []);

  // Update Markers independently when observations or onSelect update
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear old overlays
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    // Add dots for all observations
    observations.forEach((obs) => {
      const position = new window.kakao.maps.LatLng(obs.coords.lat, obs.coords.lng);
      const color = getTaxonColor(obs.taxon);
      
      const content = document.createElement('div');
      content.className = 'map-dot-marker';
      content.style.width = '16px';
      content.style.height = '16px';
      content.style.borderRadius = '50%';
      content.style.backgroundColor = color;
      content.style.border = '2px solid white';
      content.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      content.style.cursor = 'pointer';
      content.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      content.onmouseenter = () => { content.style.transform = 'scale(1.3)'; };
      content.onmouseleave = () => { content.style.transform = 'scale(1)'; };
      content.onclick = () => {
        if (onSelect) {
          onSelect(obs);
        }
      };

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 0.5,
        clickable: true
      });
      
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [observations, onSelect]);

  const zoomIn = () => {
    if (!mapRef.current) return;
    const currentLevel = mapRef.current.getLevel();
    if (currentLevel > 1) {
      mapRef.current.setLevel(currentLevel - 1, { animate: { duration: 300 } });
    }
  };

  const zoomOut = () => {
    if (!mapRef.current) return;
    const currentLevel = mapRef.current.getLevel();
    if (currentLevel < 14) {
      mapRef.current.setLevel(currentLevel + 1, { animate: { duration: 300 } });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={container} className="w-full h-full" id="main-kakao-map" />
      
      {/* Premium Minimal Zoom Controls */}
      <div className="absolute right-4 bottom-6 z-10 flex flex-col gap-1.5">
        <button
          onClick={zoomIn}
          id="map-zoom-in"
          className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="확대"
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
        <button
          onClick={zoomOut}
          id="map-zoom-out"
          className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="축소"
        >
          <Minus size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

interface Observation {
  id: string;
  name: string;
  taxon: string;
  scientificName: string;
  location: string;
  date: string;
  description: string;
  coords: { lat: number; lng: number };
  imageUrl: string;
}

const getTaxonColor = (taxon: string) => {
  const t = (taxon || '').toLowerCase().trim();
  if (t === '식물' || t === 'plant' || t === 'plants') return '#10b981'; // Green
  if (t === '포유류' || t === 'mammal' || t === 'mammals') return '#b45309'; // Brown
  if (t === '조류' || t === 'bird' || t === 'birds' || t === '새') return '#2563eb'; // Blue
  if (t === '곤충' || t === 'insect' || t === 'insects') return '#a855f7'; // Purple
  if (t === '양서/파충류' || t === 'amphibian' || t === 'reptile') return '#14b8a6'; // Teal
  if (t === '균류' || t === 'fungi' || t === 'fungus') return '#f97316'; // Orange
  return '#6b7280'; // Grey
};

interface KakaoMarkerPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

export const KakaoMarkerPicker = ({ onLocationSelect }: KakaoMarkerPickerProps) => {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.Map || !window.kakao.maps.LatLng || !container.current || mapRef.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(KNU_CENTER.lat, KNU_CENTER.lng),
      level: 3,
    };

    const map = new window.kakao.maps.Map(container.current, options);
    mapRef.current = map;

    // Custom dot for picker
    const content = document.createElement('div');
    content.style.width = '20px';
    content.style.height = '20px';
    content.style.borderRadius = '50%';
    content.style.backgroundColor = '#3b82f6';
    content.style.border = '2px solid white';
    content.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

    const overlay = new window.kakao.maps.CustomOverlay({
      position: map.getCenter(),
      content: content,
      yAnchor: 0.5,
      map: map
    });
    
    markerRef.current = overlay;

    // Ensure map layout is correct
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.relayout();
        mapRef.current.setCenter(new window.kakao.maps.LatLng(KNU_CENTER.lat, KNU_CENTER.lng));
      }
    }, 200);

    window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      
      // Move marker and center map
      overlay.setPosition(latlng);
      overlay.setMap(map); 
      map.panTo(latlng);
      
      const pos = { lat: latlng.getLat(), lng: latlng.getLng() };
      setCoords(pos);
      onLocationSelect(pos.lat, pos.lng);
    });
  }, []); // Empty dependency array to prevent re-initialization

  const zoomIn = () => {
    if (!mapRef.current) return;
    const currentLevel = mapRef.current.getLevel();
    if (currentLevel > 1) {
      mapRef.current.setLevel(currentLevel - 1, { animate: { duration: 300 } });
    }
  };

  const zoomOut = () => {
    if (!mapRef.current) return;
    const currentLevel = mapRef.current.getLevel();
    if (currentLevel < 14) {
      mapRef.current.setLevel(currentLevel + 1, { animate: { duration: 300 } });
    }
  };

  return (
    <div className="w-full h-80 border border-zinc-200 relative overflow-hidden" id="kakao-picker-container">
      <div ref={container} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 border border-zinc-200 text-[10px] tracking-wider uppercase opacity-80 z-10 pointer-events-none">
        지도를 클릭하여 위치를 선택하세요
      </div>
      {coords && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 border border-zinc-200 text-[8px] opacity-60 z-10 pointer-events-none">
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      )}

      {/* Premium Minimal Zoom Controls */}
      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={zoomIn}
          id="picker-zoom-in"
          className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="확대"
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
        <button
          onClick={zoomOut}
          id="picker-zoom-out"
          className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="축소"
        >
          <Minus size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export const StaticKakaoMap = ({ lat, lng, taxon }: { lat: number; lng: number, taxon?: string }) => {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.Map || !window.kakao.maps.LatLng || !container.current) return;

    const position = new window.kakao.maps.LatLng(lat, lng);
    const options = {
      center: position,
      level: 5,
      draggable: true,
      scrollwheel: true,
    };

    const map = new window.kakao.maps.Map(container.current, options);
    mapRef.current = map;
    
    // Use custom dot for static map too
    const color = getTaxonColor(taxon || '');
    const content = document.createElement('div');
    content.style.width = '16px';
    content.style.height = '16px';
    content.style.borderRadius = '50%';
    content.style.backgroundColor = color;
    content.style.border = '2px solid white';
    content.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

    new window.kakao.maps.CustomOverlay({
      position: position,
      content: content,
      yAnchor: 0.5,
      map: map
    });
  }, [lat, lng, taxon]);

  const zoomIn = () => {
    if (!mapRef.current) return;
    const currentLevel = mapRef.current.getLevel();
    if (currentLevel > 1) {
      mapRef.current.setLevel(currentLevel - 1, { animate: { duration: 300 } });
    }
  };

  const zoomOut = () => {
    if (!mapRef.current) return;
    const currentLevel = mapRef.current.getLevel();
    if (currentLevel < 14) {
      mapRef.current.setLevel(currentLevel + 1, { animate: { duration: 300 } });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={container} className="w-full h-full" id="static-kakao-map" />
      
      {/* Premium Minimal Zoom Controls */}
      <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          id="static-zoom-in"
          className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="확대"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
        <button
          onClick={zoomOut}
          id="static-zoom-out"
          className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="축소"
        >
          <Minus size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
