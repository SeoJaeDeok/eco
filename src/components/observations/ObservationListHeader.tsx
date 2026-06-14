import { ALL_TAXON_FILTER, type TaxonFilter } from '../../constants/taxon';
import type { ObservationSortOrder } from '../../utils/observationFilters';
import { SearchInput } from '../ui/SearchInput';

interface ObservationListHeaderProps {
  selectedTaxon: TaxonFilter;
  uniqueSpeciesCount: number;
  sortBy: ObservationSortOrder;
  onSortChange: (sortBy: ObservationSortOrder) => void;
  searchQuery: string;
  onSearchChange: (searchQuery: string) => void;
  onSearchClear: () => void;
}

export const ObservationListHeader = ({
  selectedTaxon,
  uniqueSpeciesCount,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  onSearchClear,
}: ObservationListHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-zinc-100 pb-4">
      <div>
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-3xl opacity-80 underline underline-offset-8 decoration-1 decoration-zinc-200">관찰목록</h2>
          <span className="text-[11px] font-sans px-2.5 py-1 bg-zinc-50 border border-zinc-100 text-zinc-500 font-medium rounded-full">
            {selectedTaxon === ALL_TAXON_FILTER ? `관찰종 ${uniqueSpeciesCount}종` : `${selectedTaxon} 관찰종 ${uniqueSpeciesCount}종`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase mt-4">
          <button type="button" onClick={() => onSortChange('latest')} className={`pb-0.5 border-b transition-all ${sortBy === 'latest' ? 'border-black opacity-90 font-medium' : 'border-transparent opacity-40 hover:opacity-80'}`}>최신 업로드순</button>
          <span className="opacity-20">|</span>
          <button type="button" onClick={() => onSortChange('oldest')} className={`pb-0.5 border-b transition-all ${sortBy === 'oldest' ? 'border-black opacity-90 font-medium' : 'border-transparent opacity-40 hover:opacity-80'}`}>오래된 순</button>
        </div>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="종명, 학명, 지역 검색..."
        className="relative w-full md:max-w-xs"
        iconClassName="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        iconSize={13}
        inputClassName="w-full bg-zinc-50 border border-zinc-200 py-1.5 pl-8 pr-8 text-xs font-sans rounded-none focus:outline-none focus:border-black focus:bg-white transition-all text-zinc-700"
        rightElement={searchQuery && (
          <button type="button" onClick={onSearchClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-black font-sans bg-zinc-200/50 hover:bg-zinc-200 px-1.5 py-0.5 rounded-sm transition-colors">Clear</button>
        )}
      />
    </div>
  );
};
