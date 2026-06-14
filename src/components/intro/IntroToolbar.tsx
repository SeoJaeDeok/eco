import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';

interface IntroToolbarProps {
  searchQuery: string;
  onSearchChange: (searchQuery: string) => void;
  onNavigateMap: () => void;
}

export const IntroToolbar = ({
  searchQuery,
  onSearchChange,
  onNavigateMap,
}: IntroToolbarProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 bg-zinc-50 p-4 border border-zinc-100">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="찾고 있는 한글 국명 또는 학명을 입력하세요..."
        className="relative flex-1"
        iconClassName="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
        iconSize={14}
        inputClassName="w-full bg-white border border-zinc-200 py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-black transition-all"
      />
      <Button
        onClick={onNavigateMap}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white text-[10px] tracking-[0.18em] uppercase hover:bg-zinc-800 transition-colors"
        rightIcon={<ArrowRight size={13} />}
      >
        생태지도 보기
      </Button>
    </div>
  );
};
