import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, X, Trash2, Search } from 'lucide-react';
import { MainKakaoMap, KakaoMarkerPicker, StaticKakaoMap } from './components/KakaoMap';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { IntroPage } from './components/IntroPage';
import { Observation } from './types';
import { FIXED_OBSERVATIONS } from './constants';

// Helper to perform fetch requests with auto-retry and delay when hitting the platform sleep/startup splash page.
const robustFetch = async (url: string, options?: RequestInit, retries = 10, delay = 2000): Promise<Response> => {
  const isGet = !options || !options.method || options.method.toUpperCase() === 'GET';
  const actualRetries = isGet ? retries : 3;

  for (let i = 0; i < actualRetries; i++) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';
      
      // If the page is returning HTML where we expect JSON (i.e. ANY API request),
      // we treat it as a transient loading, bootup, or standby page.
      if (url.includes('/api/') && contentType.includes('text/html')) {
        const clone = response.clone();
        const text = await clone.text();
        console.warn(`[Robust Fetch] Received HTML response instead of JSON for API request ${url} (Length: ${text.length}). Retrying request ${i + 1}/${actualRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (i === actualRetries - 1) throw err;
      console.warn(`[Robust Fetch] Network/Fetch error on ${url}. Retrying request ${i + 1}/${actualRetries} in ${delay}ms...`, err);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed to fetch from ${url} after ${actualRetries} attempts.`);
};

// --- Sub-components (could be moved to separate files if complexity persists) ---

const MapPage = ({ observations, onSelect }: { observations: Observation[]; onSelect: (obs: Observation) => void }) => {
  const TAXA_COLORS = [
    { label: '식물 (Plant)', color: '#10b981' },
    { label: '포유류 (Mammal)', color: '#b45309' },
    { label: '조류 (Bird)', color: '#2563eb' },
    { label: '곤충 (Insect)', color: '#a855f7' },
    { label: '양서/파충류 (Amphibian/Reptile)', color: '#14b8a6' },
    { label: '균류 (Fungi)', color: '#f97316' },
    { label: '기타 (Others)', color: '#6b7280' },
  ];

  return (
    <div className="h-screen flex flex-col pt-20" id="map-page">
      <div className="flex-1 w-full bg-zinc-100 overflow-hidden relative">
        <MainKakaoMap observations={observations} onSelect={onSelect} />
        <div className="absolute bottom-6 left-6 z-10 bg-white/80 backdrop-blur-sm p-3 border border-zinc-100 shadow-xl max-w-[160px]">
          <h4 className="text-[8px] tracking-[0.2em] uppercase opacity-40 mb-2 border-b border-zinc-100 pb-1">Legend</h4>
          <div className="space-y-1">
            {TAXA_COLORS.map(t => (
              <div key={t.label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-[9px] font-light opacity-70 leading-none">{t.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ObservationPage = ({ 
  observations, 
  onSelect, 
  onDelete, 
  onCleanup,
  onDeleteAll
}: { 
  observations: Observation[]; 
  onSelect: (obs: Observation) => void; 
  onDelete: (id: string) => void; 
  onCleanup?: () => void;
  onDeleteAll?: () => void;
}) => {
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [selectedTaxon, setSelectedTaxon] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredObservations = useMemo(() => {
    let result = observations;
    if (selectedTaxon !== '전체') {
      result = result.filter(obs => obs.taxon === selectedTaxon);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(obs => 
        (obs.name || '').toLowerCase().includes(q) || 
        (obs.scientificName || '').toLowerCase().includes(q) ||
        (obs.location || '').toLowerCase().includes(q) ||
        (obs.description || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [observations, selectedTaxon, searchQuery]);

  const sortedObservations = useMemo(() => {
    return [...filteredObservations].sort((a, b) => {
      const getVal = (obs: Observation) => {
        if (!obs.date) return 0;
        const normalized = obs.date.trim().replace(/-/g, '/');
        const parsed = Date.parse(normalized);
        if (!isNaN(parsed)) return parsed;
        if (obs.createdAt) {
          const cat = Date.parse(String(obs.createdAt));
          if (!isNaN(cat)) return cat;
        }
        return 0;
      };

      const valA = getVal(a);
      const valB = getVal(b);

      if (valA !== valB) {
        return sortBy === 'latest' ? valB - valA : valA - valB;
      }

      return sortBy === 'latest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
    });
  }, [filteredObservations, sortBy]);

  const uniqueSpeciesCount = useMemo(() => {
    const speciesSet = new Set(filteredObservations.map(obs => (obs.name || '').trim()).filter(Boolean));
    return speciesSet.size;
  }, [filteredObservations]);

  return (
    <div className="min-h-screen pt-32 px-6 md:px-10 pb-20" id="observation-page">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-3xl opacity-80 underline underline-offset-8 decoration-1 decoration-zinc-200">관찰목록</h2>
              <span className="text-[11px] font-sans px-2.5 py-1 bg-zinc-50 border border-zinc-100 text-zinc-500 font-medium rounded-full">
                {selectedTaxon === '전체' ? `관찰종 ${uniqueSpeciesCount}종` : `${selectedTaxon} 관찰종 ${uniqueSpeciesCount}종`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase mt-4">
              <button 
                onClick={() => setSortBy('latest')}
                className={`pb-0.5 border-b transition-all ${sortBy === 'latest' ? 'border-black opacity-90 font-medium' : 'border-transparent opacity-40 hover:opacity-80'}`}
              >
                최신 업로드순
              </button>
              <span className="opacity-20">|</span>
              <button 
                onClick={() => setSortBy('oldest')}
                className={`pb-0.5 border-b transition-all ${sortBy === 'oldest' ? 'border-black opacity-90 font-medium' : 'border-transparent opacity-40 hover:opacity-80'}`}
              >
                오래된 순
              </button>
            </div>
          </div>

          {/* Minimalist Search Area */}
          <div className="relative w-full md:max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="종명, 학명, 지역 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 py-1.5 pl-8 pr-8 text-xs font-sans rounded-none focus:outline-none focus:border-black focus:bg-white transition-all text-zinc-700"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-black font-sans bg-zinc-200/50 hover:bg-zinc-200 px-1.5 py-0.5 rounded-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Beautiful Taxon Category Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-10 mt-6">
          {['전체', '식물', '포유류', '조류', '곤충', '양서/파충류', '균류', '기타'].map(taxon => {
            const count = observations.filter(obs => taxon === '전체' || obs.taxon === taxon).length;
            const isSelected = selectedTaxon === taxon;
            return (
              <button
                key={taxon}
                onClick={() => setSelectedTaxon(taxon)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-sans tracking-wide transition-all border ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-sm font-semibold'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                {taxon} <span className={`text-[10px] ml-1 font-medium ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {sortedObservations.map((obs) => {
            const isFixed = obs.isFixed || obs.id.startsWith('fixed-');
            return (
              <div key={obs.id} className="group cursor-pointer" onClick={() => onSelect(obs)}>
                <div className="aspect-square bg-zinc-50 border border-zinc-100 mb-1.5 overflow-hidden relative transition-all duration-700 flex items-center justify-center">
                  {obs.imageUrl ? (
                    <img src={obs.imageUrl} alt={obs.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 font-serif text-[10px] italic p-4 text-center">
                      <div className="mb-2">No Photo</div>
                    </div>
                  )}
                </div>
                <p className="text-[9px] tracking-widest uppercase opacity-40 mb-0.5 ml-[1px]">
                  {obs.taxon}
                  {obs.location && obs.location.trim() !== '경북대학교 캠퍼스' && ` • ${obs.location}`}
                  {obs.date && ` • ${obs.date}`}
                </p>
                <div className="flex justify-between items-center group/item hover:bg-zinc-50 transition-colors p-1 -m-1 rounded">
                  <h3 className="text-[11px] font-medium opacity-70 ml-[1px] group-hover:opacity-100 transition-opacity leading-tight truncate mr-2">{obs.name}</h3>
                  {!isFixed && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 기록을 삭제하시겠습니까?')) {
                          onDelete(obs.id);
                        }
                      }}
                      className="opacity-0 group-hover/item:opacity-30 hover:opacity-100 hover:text-red-500 transition-all p-1"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {sortedObservations.length === 0 && (
          <p className="text-center py-20 text-zinc-400 font-light tracking-wide italic">아직 기록된 관찰 정보가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

const ObservationDetail = ({ observation, onClose, onDelete }: { observation: Observation; onClose: () => void; onDelete: (id: string) => void }) => {
  const isFixed = observation.isFixed || observation.id.startsWith('fixed-');
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white overflow-y-auto px-6 pt-32 pb-20"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-12">
          <div className="text-left">
            <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">
              {observation.taxon}
              {observation.location && observation.location.trim() !== '경북대학교 캠퍼스' && ` • ${observation.location}`}
              {observation.date && ` • ${observation.date}`}
            </p>
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-4xl mb-2">{observation.name}</h2>
              {!isFixed && (
                <button onClick={() => { if (confirm('이 기록을 삭제하시겠습니까?')) { onDelete(observation.id); onClose(); } }} className="p-2 text-zinc-300 hover:text-red-400 transition-colors">
                  <Trash2 size={18} />
                </button>
              )}
              {/* Fixed state indicator removed as per user request */}
            </div>
            <p className="text-sm italic opacity-50 font-light">{observation.scientificName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:opacity-50 transition-opacity">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center">
            <img src={observation.imageUrl} alt={observation.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div className="text-left space-y-6">
            <div>
              <h4 className="text-[10px] tracking-widest uppercase opacity-30 mb-2 border-b border-zinc-100 pb-1">상세 정보</h4>
              <p className="text-xs font-light leading-relaxed opacity-70 whitespace-pre-wrap">{observation.description || '상세 설명이 없습니다.'}</p>
            </div>
            <div>
              <h4 className="text-[10px] tracking-widest uppercase opacity-30 mb-2 border-b border-zinc-100 pb-1">관찰 위치</h4>
              <div className="w-full h-48 border border-zinc-100 mb-2 overflow-hidden">
                {observation.coords && <StaticKakaoMap lat={observation.coords.lat} lng={observation.coords.lng} taxon={observation.taxon} />}
              </div>
              {observation.location && observation.location.trim() !== '경북대학교 캠퍼스' && (
                <p className="text-xs font-light opacity-60 mb-1">{observation.location}</p>
              )}
              {observation.coords && <p className="text-[9px] font-mono opacity-40">{observation.coords.lat.toFixed(6)}, {observation.coords.lng.toFixed(6)}</p>}
            </div>
            <button onClick={onClose} className="w-full md:w-auto px-10 py-3 border border-zinc-200 text-[10px] tracking-widest uppercase font-medium hover:border-black transition-all">
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ObservationUploadPage = ({ onCancel, onUpload }: { onCancel: () => void; onUpload: (obs: Omit<Observation, 'id' | 'imageUrl'>, imageBlob: Blob) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    taxon: '식물',
    location: '경북대학교 캠퍼스',
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    description: '',
  });
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 500;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX_DIM) { h *= MAX_DIM / w; w = MAX_DIM; } }
          else { if (h > MAX_DIM) { w *= MAX_DIM / h; h = MAX_DIM; } }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          setImagePreview(dataUrl);
          canvas.toBlob((blob) => {
            setImageBlob(blob);
          }, 'image/jpeg', 0.65);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (isUploading) return;
    
    if (!formData.name) {
      alert('생물 이름을 입력해주세요.');
      return;
    }
    
    if (!selectedCoords) {
      alert('지도에서 위치를 선택해주세요.');
      return;
    }
    
    if (!imageBlob) {
      alert('현장의 생생한 사진을 한 장 선택해주세요.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      onUpload({ 
        name: formData.name,
        scientificName: formData.scientificName,
        taxon: formData.taxon,
        location: formData.location,
        date: formData.date,
        description: formData.description,
        coords: selectedCoords
      }, imageBlob);
      setIsUploading(false);
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`오류가 발생했습니다: ${error.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 md:px-20 pb-20 max-w-2xl mx-auto" id="upload-page">
      <h2 className="font-serif text-2xl mb-6 text-center opacity-80 underline underline-offset-8 decoration-1 decoration-zinc-200">관찰 기록하기</h2>
      <div className="space-y-5 text-left">
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-1.5 opacity-40">분류군</label>
          <div className="flex flex-wrap gap-1.5">
            {['식물', '포유류', '조류', '곤충', '양서/파충류', '균류', '기타'].map(t => (
              <button key={t} onClick={() => setFormData({ ...formData, taxon: t })} className={`px-3 py-1.5 text-[10px] font-light border transition-all ${formData.taxon === t ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}>{t}</button>
            ))}
          </div>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="국명 / 종명 *" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white" 
            />
            <input type="text" placeholder="학명 (선택사항)" value={formData.scientificName} onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })} className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white italic" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="관찰 위치 (선택사항)" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white" />
            <input type="text" placeholder="날짜 (예: 2026-05-19 13:00)" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border border-zinc-100 p-2.5 text-xs focus:outline-none focus:border-black bg-white" />
          </div>
        <label className="border border-dashed border-zinc-100 bg-zinc-50 h-56 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-300 transition-colors relative">
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {imagePreview ? <img src={imagePreview} className="absolute inset-0 w-full h-full object-contain p-2" /> : <p className="text-[10px] tracking-widest uppercase opacity-40 text-center px-4">클릭하여 사진 선택<br/><span className="lowercase font-light mt-1 block opacity-60">정사각형으로 조정됩니다</span></p>}
        </label>
        <div className="h-64 rounded-sm overflow-hidden border border-zinc-100">
          <KakaoMarkerPicker onLocationSelect={(lat, lng) => setSelectedCoords({lat, lng})} />
        </div>
        <textarea placeholder="상세 설명" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-zinc-100 p-2.5 text-xs h-24 focus:outline-none focus:border-black bg-white resize-none" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-zinc-100 text-zinc-300 py-3 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-50">취소</button>
          <button onClick={handleSubmit} disabled={isUploading} className="flex-[2] py-3 text-[10px] tracking-[0.2em] uppercase text-white font-medium bg-black hover:bg-zinc-900">기록 업로드하기</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [dbObservations, setDbObservations] = useState<Observation[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [isUploadingState, setIsUploadingState] = useState(false);

  // Merge fixed observations (code) and database observations (Express API JSON store)
  const observations = useMemo(() => {
    const all = [...FIXED_OBSERVATIONS, ...dbObservations];
    const mapped = all.map(obs => {
      // Force taxon to '조류' if name matches pattern
      if (obs.name && (obs.name.includes('오목눈') || obs.name.includes('박새'))) {
        return { ...obs, taxon: '조류' };
      }
      return obs;
    });
    const seen = new Set();
    return mapped.filter(obs => {
      const id = obs.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [dbObservations]);

  const uniqueSpeciesCount = useMemo(() => {
    const speciesSet = new Set(observations.map(obs => (obs.name || '').trim()).filter(Boolean));
    return speciesSet.size;
  }, [observations]);

  // Load observations on mount from Express API & Sync with LocalStorage fallback
  useEffect(() => {
    const loadObservations = async () => {
      let apiObs: Observation[] = [];
      try {
        const res = await robustFetch('/api/observations');
        if (res.ok) {
          const data = await res.json();
          apiObs = data.filter((obs: any) => obs.coords && typeof obs.coords.lat === 'number');
        }
      } catch (err: any) {
        console.error('Error fetching observations from backend:', err);
      }

      // Merge with localStorage
      let localObs: Observation[] = [];
      try {
        const stored = localStorage.getItem('user_observations');
        if (stored) {
          localObs = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading index from localStorage:', e);
      }

      const mergedMap = new Map<string, Observation>();
      // Populate localStorage baseline
      localObs.forEach(obs => {
        if (obs && obs.id) mergedMap.set(obs.id, obs);
      });
      // Merge with newest server-loaded records
      apiObs.forEach(obs => {
        if (obs && obs.id) mergedMap.set(obs.id, obs);
      });

      const finalObsList = Array.from(mergedMap.values()).map((obs: Observation) => {
        if (obs && (
          obs.name === '곰개미' || obs.name?.includes('곰개미') ||
          obs.name === '그물등개미' || obs.name?.includes('그물등개미')
        )) {
          return { ...obs, taxon: '곤충' };
        }
        return obs;
      });
      setDbObservations(finalObsList);
      
      // Save fully back to keep them perfectly in sync
      try {
        localStorage.setItem('user_observations', JSON.stringify(finalObsList));
      } catch (_) {}

      // Bulk sync to server to permanently lock down local observations from browser
      if (localObs.length > 0) {
        try {
          console.log('[SYNC] Automatically backing up browser-only records to backend database...');
          await robustFetch('/api/sync-observations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ observations: finalObsList })
          });
          console.log('[SYNC] Auto-backup completed successfully!');
        } catch (syncErr) {
          console.error('[SYNC] Auto-backup failed:', syncErr);
        }
      }
    };

    loadObservations();
  }, []);

  const navigate = (page: string) => {
    setCurrentPage(page);
    setSelectedObservation(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (metadata: Omit<Observation, 'id' | 'imageUrl'>, imageBlob: Blob) => {
    setIsUploadingState(true);
    
    // Generate an optimistic client fallback so they see the upload list updated INSTANTLY
    const tempId = "user-" + Date.now();
    let localBase64 = '';
    try {
      const reader = new FileReader();
      const convertPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageBlob);
      });
      localBase64 = await convertPromise;
    } catch (err) {
      console.warn('Fallback base64 conversion failed:', err);
    }

    const optimisticObs: Observation = {
      id: tempId,
      ...metadata,
      imageUrl: localBase64,
      isFixed: false,
      date: metadata.date || new Date().toISOString().slice(0, 10)
    };

    // Commit instantly into React state and local storage index to safeguard data forever
    setDbObservations(prev => [optimisticObs, ...prev]);
    try {
      const stored = localStorage.getItem('user_observations');
      const current = stored ? JSON.parse(stored) : [];
      localStorage.setItem('user_observations', JSON.stringify([optimisticObs, ...current]));
    } catch (_) {}

    try {
      // Pro-actively ensure the server is fully awake before posting the payload
      try {
        await robustFetch('/api/health');
      } catch (hErr) {
        console.warn('Pre-upload wakeup ping failed/timed out:', hErr);
      }

      const formData = new FormData();
      formData.append('image', imageBlob, 'observation.jpg');
      formData.append('metadata', JSON.stringify(metadata));

      const response = await robustFetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload server fault status ${response.status}`);
      }

      const responseData = await response.json();
      const serverObs = responseData.observation as Observation;
      
      // Upgrade from optimistic client-side fallback to server persistent registry
      setDbObservations(prev => {
        const cleaned = prev.filter(obs => obs.id !== tempId);
        const next = [serverObs, ...cleaned];
        try {
          localStorage.setItem('user_observations', JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      setIsUploadingState(false);
      navigate('observations');
    } catch (error: any) {
      console.error('Remote save failed, but local copy is active:', error);
      setIsUploadingState(false);
      // Since it is already safely registered in localStorage, we can navigate the user beautifully and reassure them
      alert('소중한 관찰 기록이 이 기기에 즉시 완전히 안전하게 저장되었습니다! 네트워크 슬립 현상 등으로 서버 백업 동기화가 지연되고 있지만 걱정하지 않으셔도 되며, 지도와 관찰목록에서 영구적으로 보존됩니다.');
      navigate('observations');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Instantly clear from state and local storage
      setDbObservations(prev => {
        const next = prev.filter(obs => obs.id !== id);
        try {
          localStorage.setItem('user_observations', JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      // Ensure server is awake before making DELETE mutation request
      try {
        await robustFetch('/api/health');
      } catch (hErr) {
        console.warn('Pre-delete wakeup ping failed:', hErr);
      }

      // Sync deletion with backend
      await robustFetch(`/api/observations/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      console.error('Delete backend synchronization skipped/failed:', error);
    }
  };

  const handleCleanup = async () => {
    const userObs = dbObservations;
    if (userObs.length === 0) return;
    const seen = new Set<string>();
    const toDelete: string[] = [];
    userObs.forEach(obs => {
      const key = `${obs.name}-${obs.date}`.toLowerCase();
      if (seen.has(key)) toDelete.push(obs.id);
      else seen.add(key);
    });
    if (toDelete.length > 0 && confirm(`${toDelete.length}개의 중복 기록을 정리하시겠습니까?`)) {
      try {
        setDbObservations(prev => {
          const next = prev.filter(obs => !toDelete.includes(obs.id));
          try {
            localStorage.setItem('user_observations', JSON.stringify(next));
          } catch (_) {}
          return next;
        });

        // Ensure server is awake
        try {
          await robustFetch('/api/health');
        } catch (_) {}

        await Promise.all(toDelete.map(id => robustFetch(`/api/observations/${id}`, { method: 'DELETE' })));
      } catch (error) {
        console.error('Cleanup failed:', error);
        alert('중복 정리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeleteAll = async () => {
    const userObs = dbObservations;
    if (userObs.length === 0) return;
    if (confirm('박새를 제외한 모든 사용자 기록을 데이터베이스에서 영구적으로 삭제하시겠습니까?')) {
      try {
        setDbObservations([]);
        try {
          localStorage.removeItem('user_observations');
        } catch (_) {}

        // Ensure server is awake before making DELETE mutation request
        try {
          await robustFetch('/api/health');
        } catch (hErr) {
          console.warn('Pre-deleteAll wakeup ping failed:', hErr);
        }

        const res = await robustFetch('/api/observations', { method: 'DELETE' });
        if (!res.ok) {
          console.warn('Syncing all delete with server returned non-ok:', res.status);
        }
      } catch (error) {
        console.error('Delete all failed:', error);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-white" id="app-root">
      {currentPage === 'home' && (
        <div 
          className="fixed inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000")' }}
        />
      )}
      
      <Navbar onNavigate={navigate} observationCount={observations.length} uniqueSpeciesCount={uniqueSpeciesCount} />

      <main className="relative z-10">
        <AnimatePresence>
          {currentPage === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Hero />
            </motion.div>
          )}
          {currentPage === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MapPage observations={observations} onSelect={setSelectedObservation} />
            </motion.div>
          )}
          {currentPage === 'observations' && (
            <motion.div key="obs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ObservationPage 
                observations={observations} 
                onSelect={setSelectedObservation} 
                onDelete={handleDelete} 
                onCleanup={handleCleanup} 
                onDeleteAll={handleDeleteAll} 
              />
            </motion.div>
          )}
          {currentPage === 'upload' && (
            <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ObservationUploadPage onCancel={() => navigate('observations')} onUpload={handleUpload} />
            </motion.div>
          )}
          {currentPage === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <IntroPage 
                observations={observations} 
                onSelectSpecimen={setSelectedObservation} 
                onNavigate={navigate} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedObservation && <ObservationDetail observation={selectedObservation} onClose={() => setSelectedObservation(null)} onDelete={handleDelete} />}
      </AnimatePresence>

      {/* Persistent Beautiful Saving/Uploading Overlay */}
      {isUploadingState && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-serif text-sm tracking-widest uppercase opacity-75">새로운 관찰 기록을 영구 저장하는 중입니다...</p>
          <p className="text-[10px] font-sans opacity-40 mt-1">현장의 선명한 사진과 지도 위치가 즉시 이 기기와 클라우드에 영구 백업됩니다.</p>
        </div>
      )}
    </div>
  );
}
