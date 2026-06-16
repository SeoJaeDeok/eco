import { ALL_TAXON_FILTER, type TaxonFilter } from '../../constants/taxon';
import type { ImageFilter, ObservationSortKey } from '../../utils/observationFilters';
import { SearchInput } from '../ui/SearchInput';

interface ObservationListHeaderProps {
  selectedTaxon: TaxonFilter;
  uniqueSpeciesCount: number;
  resultCount: number;
  totalCount: number;
  sortKey: ObservationSortKey;
  onSortChange: (sortKey: ObservationSortKey) => void;
  searchQuery: string;
  onSearchChange: (searchQuery: string) => void;
  onSearchClear: () => void;
  imageFilter: ImageFilter;
  onImageFilterChange: (imageFilter: ImageFilter) => void;
}

const SORT_OPTIONS: Array<{ key: ObservationSortKey; label: string }> = [
  { key: 'newest', label: '최신순' },
  { key: 'oldest', label: '오래된순' },
  { key: 'name', label: '관찰명순' },
];

const IMAGE_FILTER_OPTIONS: Array<{ key: ImageFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'with-image', label: '사진 있음' },
  { key: 'without-image', label: '사진 없음' },
];

const getControlClassName = (active: boolean) => {
  return `pb-0.5 border-b transition-all ${active ? 'border-black opacity-90 font-medium' : 'border-transparent opacity-40 hover:opacity-80'}`;
};

const getImageFilterClassName = (active: boolean) => {
  return `border px-2.5 py-1 text-[10px] transition-colors ${active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800'}`;
};

export const ObservationListHeader = ({
  selectedTaxon,
  uniqueSpeciesCount,
  resultCount,
  totalCount,
  sortKey,
  onSortChange,
  searchQuery,
  onSearchChange,
  onSearchClear,
  imageFilter,
  onImageFilterChange,
}: ObservationListHeaderProps) => {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4 border-b border-zinc-100 pb-4 md:flex-row md:items-end">
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-serif text-3xl opacity-80 underline decoration-zinc-200 decoration-1 underline-offset-8">관찰목록</h2>
          <span className="rounded-full border border-zinc-100 bg-zinc-50 px-2.5 py-1 font-sans text-[11px] font-medium text-zinc-500">
            {selectedTaxon === ALL_TAXON_FILTER ? `관찰종 ${uniqueSpeciesCount}종` : `${selectedTaxon} 관찰종 ${uniqueSpeciesCount}종`}
          </span>
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zinc-400">
            {resultCount}/{totalCount}건
          </span>
        </div>

        <fieldset className="mt-4 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest">
          <legend className="sr-only">관찰 기록 정렬</legend>
          {SORT_OPTIONS.map((option, index) => (
            <div key={option.key} className="flex items-center gap-3">
              {index > 0 && <span className="opacity-20">|</span>}
              <button
                type="button"
                onClick={() => onSortChange(option.key)}
                aria-pressed={sortKey === option.key}
                className={getControlClassName(sortKey === option.key)}
              >
                {option.label}
              </button>
            </div>
          ))}
        </fieldset>
      </div>

      <div className="flex w-full flex-col gap-3 md:max-w-sm">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="종명, 학명, 위치, 설명 검색..."
          ariaLabel="관찰 기록 검색"
          className="relative w-full"
          iconClassName="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          iconSize={13}
          inputClassName="w-full bg-zinc-50 border border-zinc-200 py-1.5 pl-8 pr-10 text-xs font-sans rounded-none focus:outline-none focus:border-black focus:bg-white transition-all text-zinc-700"
          rightElement={searchQuery && (
            <button
              type="button"
              onClick={onSearchClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-zinc-200/50 px-1.5 py-0.5 font-sans text-[10px] text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-black"
            >
              지우기
            </button>
          )}
        />

        <fieldset className="flex flex-wrap justify-start gap-1.5 md:justify-end">
          <legend className="sr-only">사진 포함 여부 필터</legend>
          {IMAGE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onImageFilterChange(option.key)}
              aria-pressed={imageFilter === option.key}
              className={getImageFilterClassName(imageFilter === option.key)}
            >
              {option.label}
            </button>
          ))}
        </fieldset>
      </div>
    </div>
  );
};
