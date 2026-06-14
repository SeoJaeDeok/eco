import { useMemo, useState } from 'react';
import { Observation } from '../types';
import { motion } from 'motion/react';
import { BookOpen, Leaf, Search, ArrowRight, ExternalLink } from 'lucide-react';

interface IntroPageProps {
  observations: Observation[];
  onSelectSpecimen: (obs: Observation) => void;
  onNavigate: (page: string) => void;
}

export const IntroPage = ({ observations, onSelectSpecimen, onNavigate }: IntroPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaxonFilter, setActiveTaxonFilter] = useState<'all' | string>('all');

  const TAXA_LIST = ['식물', '포유류', '조류', '곤충', '양서/파충류', '균류', '기타'];

  // Match taxon styling colors with KakaoMap and observation badges
  const getTaxonStyles = (taxon: string) => {
    switch (taxon) {
      case '식물':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', dot: 'bg-emerald-500' };
      case '포유류':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-100', dot: 'bg-amber-700' };
      case '조류':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-100', dot: 'bg-blue-600' };
      case '곤충':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-100', dot: 'bg-purple-500' };
      case '양서/파충류':
        return { bg: 'bg-teal-50 text-teal-800 border-teal-100', dot: 'bg-teal-500' };
      case '균류':
        return { bg: 'bg-orange-50 text-orange-800 border-orange-100', dot: 'bg-orange-500' };
      default:
        return { bg: 'bg-zinc-100 text-zinc-800 border-zinc-200', dot: 'bg-zinc-500' };
    }
  };

  // Group unique species with their info & matching observation for deep link interactions
  const groupedSpecies = useMemo(() => {
    const speciesMap = new Map<string, {
      name: string;
      scientificName: string;
      taxon: string;
      count: number;
      representativeObs: Observation;
    }>();

    observations.forEach(obs => {
      const cleanName = (obs.name || '').trim();
      if (!cleanName) return;

      const cleanScientific = (obs.scientificName || '').trim() || 'Scientific name unrecorded';
      const key = `${cleanName}__${cleanScientific}`;

      if (speciesMap.has(key)) {
        const existing = speciesMap.get(key)!;
        existing.count += 1;
        // User uploads take priority for representativeObs, or keep latest
        if (!existing.representativeObs.imageUrl && obs.imageUrl) {
          existing.representativeObs = obs;
        }
      } else {
        speciesMap.set(key, {
          name: cleanName,
          scientificName: cleanScientific,
          taxon: obs.taxon || '기타',
          count: 1,
          representativeObs: obs
        });
      }
    });

    const list = Array.from(speciesMap.values());

    // Group by taxon
    const groups: { [taxon: string]: typeof list } = {};
    TAXA_LIST.forEach(t => {
      groups[t] = [];
    });
    // Fallback for any missing in loop
    groups['기타'] = groups['기타'] || [];

    list.forEach(sp => {
      const groupName = TAXA_LIST.includes(sp.taxon) ? sp.taxon : '기타';
      groups[groupName].push(sp);
    });

    return groups;
  }, [observations]);

  // Total unique species across the whole app
  const totalSpeciesCount = useMemo(() => {
    const speciesSet = new Set(observations.map(obs => (obs.name || '').trim()).filter(Boolean));
    return speciesSet.size;
  }, [observations]);

  return (
    <div className="min-h-screen pt-32 px-6 md:px-10 pb-24 bg-white" id="intro-page">
      <div className="max-w-5xl mx-auto">
        
        {/* Intro Header Section */}
        <div className="mb-14 border-b border-zinc-100 pb-10">
          <div className="flex items-center gap-2 text-zinc-400 text-[10px] tracking-[0.2em] uppercase mb-4">
            <BookOpen size={12} />
            <span>KNU Campus Flora & Fauna Database</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl tracking-tight text-zinc-900 mb-6 leading-tight">
            경북대학교 대구캠퍼스<br className="hidden sm:inline" /> 생물다양성 도감
          </h1>
          <p className="font-sans text-sm text-zinc-500 leading-relaxed max-w-3xl">
            경북대학교 대구캠퍼스는 일청담, 지도못 등 풍부한 녹지 환경 덕분에 도심 속에서도 다양한 야생 생물의 안식처 역할을 하고 있습니다. 
            기록과 학우분들의 실시간 제보를 바탕으로 수집된 소중한 관찰 기록들을 분류군별로 보존하고 있습니다.
          </p>

          <div className="flex flex-wrap items-center gap-8 mt-8">
            <div className="flex flex-col">
              <span className="text-3xl font-serif font-light text-black">{totalSpeciesCount}</span>
              <span className="text-[10px] text-zinc-400 tracking-wider uppercase mt-1">총 관찰 종 수</span>
            </div>
            <div className="w-px h-8 bg-zinc-100 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-3xl font-serif font-light text-zinc-700">{observations.length}</span>
              <span className="text-[10px] text-zinc-400 tracking-wider uppercase mt-1">누적 기록 건수</span>
            </div>
            <div className="w-px h-8 bg-zinc-100 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-3xl font-serif font-light text-emerald-600">
                {groupedSpecies['식물']?.length || 0}
              </span>
              <span className="text-[10px] text-zinc-400 tracking-wider uppercase mt-1">식물 분류군 종 수</span>
            </div>
          </div>
        </div>

        {/* Search and Navigation helper */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 bg-zinc-50 p-4 border border-zinc-100">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="찾고 있는 한글 국명 또는 학명을 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-[11px] font-sans tracking-wider flex items-center gap-1.5 transition-colors"
            >
              새로운 기록 등록하기 <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Dynamic List Rendered beautifully by Taxon Category */}
        <div className="space-y-12">
          {TAXA_LIST.map((taxonName) => {
            const speciesInTaxon = groupedSpecies[taxonName] || [];
            
            // Apply search query filter if typed
            const filteredSpecies = speciesInTaxon.filter(sp => {
              if (!searchQuery) return true;
              return sp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     sp.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
            });

            if (filteredSpecies.length === 0 && searchQuery) {
              return null; // Don't show empty taxons under active search
            }

            const style = getTaxonStyles(taxonName);

            return (
              <div key={taxonName} className="border-t border-zinc-100 pt-8" id={`taxon-group-${taxonName}`}>
                {/* Taxon Heading Section */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <h3 className="font-serif text-xl tracking-wide text-zinc-900">{taxonName}</h3>
                    <span className="text-xs text-zinc-400 border border-zinc-100 px-2 py-0.5 rounded-full bg-zinc-50">
                      총 {speciesInTaxon.length}종
                    </span>
                  </div>
                  {filteredSpecies.length !== speciesInTaxon.length && (
                    <span className="text-[10px] text-zinc-400">검색 필터 결과: {filteredSpecies.length}종</span>
                  )}
                </div>

                {filteredSpecies.length === 0 ? (
                  <p className="text-zinc-400 text-xs italic pl-4 py-2">등록된 종 정보가 아직 전무하거나 검색과 일치하는 항목이 없습니다.</p>
                ) : (
                  /* Elegant table or layout displaying Species details */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 pl-4">
                    {filteredSpecies.map((species) => (
                      <div 
                        key={`${species.name}_${species.scientificName}`}
                        onClick={() => onSelectSpecimen(species.representativeObs)}
                        className="group flex items-center justify-between py-2 border-b border-zinc-50 hover:bg-zinc-50 px-2 -mx-2 transition-all cursor-pointer rounded-sm"
                        title="클릭하여 상세 정보 및 지도 보기"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="font-sans text-sm text-zinc-800 font-medium group-hover:text-black group-hover:underline decoration-1 underline-offset-4">
                            {species.name}
                          </span>
                          <span className="font-sans text-xs text-zinc-400 italic font-light tracking-wide group-hover:text-zinc-600">
                            {species.scientificName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-sm">
                            {species.count}건 관찰됨
                          </span>
                          <ExternalLink size={10} className="text-zinc-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Informative Footer Box */}
        <div className="mt-20 p-8 border border-zinc-100 bg-zinc-50/50 rounded-sm">
          <h4 className="font-serif text-sm text-zinc-800 mb-3">도감 정보 가이드</h4>
          <p className="font-sans text-[11px] text-zinc-500 leading-relaxed">
            본 도감은 캠퍼스 유저가 직접 관찰하고 스마트폰으로 업로드한 실시간 생태 데이터를 종합하여 반영합니다. 도감에 기재된 모든 생물의 국명과 학명은 국가생물종목록의 가장 최신 기준(National Species List of Korea)을 상시 대조하여 정확하게 반영하고 있습니다. 학명(Scientific Name)은 국제명명규약(ICZN/ICN)의 이명법(Binomial nomenclature) 표기 스타일을 따르며, 표에서 각 생명체를 클릭하시면 실제로 해당 종이 목격된 정확한 지리적 위치와 사진, 일시가 담긴 생태 카드로 이동합니다.
          </p>
        </div>

      </div>
    </div>
  );
};
