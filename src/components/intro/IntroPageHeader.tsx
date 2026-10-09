import { BookOpen } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';

interface IntroPageHeaderProps {
  totalSpeciesCount: number;
  observationCount: number;
  plantSpeciesCount: number;
}

export const IntroPageHeader = ({
  totalSpeciesCount,
  observationCount,
  plantSpeciesCount,
}: IntroPageHeaderProps) => {
  return (
    <PageHeader
      className="mb-14 border-b border-zinc-100 pb-10"
      eyebrow={(
        <div className="flex items-center gap-2 text-zinc-400 text-[10px] tracking-[0.2em] uppercase mb-4">
          <BookOpen size={12} />
          <span>KNU Campus Flora & Fauna Database</span>
        </div>
      )}
      title={(
        <h1 className="font-serif text-3xl md:text-5xl tracking-tight text-zinc-900 mb-6 leading-tight">
          경북대학교 대구캠퍼스<br className="hidden sm:inline" /> 생물다양성 도감
        </h1>
      )}
      meta={(
        <div className="flex flex-wrap items-center gap-8 mt-8">
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-light text-black">{totalSpeciesCount}</span>
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase mt-1">총 관찰 종 수</span>
          </div>
          <div className="w-px h-8 bg-zinc-100 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-light text-zinc-700">{observationCount}</span>
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase mt-1">샘플 기록 건수</span>
          </div>
          <div className="w-px h-8 bg-zinc-100 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-3xl font-serif font-light text-emerald-600">{plantSpeciesCount}</span>
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase mt-1">식물 분류군 종 수</span>
          </div>
        </div>
      )}
    />
  );
};
