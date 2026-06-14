export const MapTexture = () => (
  <div
    className="absolute inset-0 opacity-70"
    style={{
      backgroundImage: 'linear-gradient(90deg, rgba(39,39,42,0.06) 1px, transparent 1px), linear-gradient(rgba(39,39,42,0.06) 1px, transparent 1px)',
      backgroundSize: '42px 42px',
    }}
  />
);

export const CampusLabels = () => (
  <>
    <div className="absolute left-[16%] top-[18%] text-[10px] tracking-[0.2em] uppercase text-zinc-400">North Gate</div>
    <div className="absolute right-[18%] top-[30%] text-[10px] tracking-[0.2em] uppercase text-zinc-400">Science Walk</div>
    <div className="absolute left-[20%] bottom-[24%] text-[10px] tracking-[0.2em] uppercase text-zinc-400">Central Green</div>
    <div className="absolute right-[20%] bottom-[18%] text-[10px] tracking-[0.2em] uppercase text-zinc-400">Pond Area</div>
    <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-zinc-200/70 bg-white/20" />
    <div className="absolute left-[42%] top-[52%] w-44 h-px rotate-[-18deg] bg-zinc-200/80" />
    <div className="absolute left-[25%] top-[38%] w-56 h-px rotate-[22deg] bg-zinc-200/80" />
    <div className="absolute right-[18%] top-[52%] w-48 h-px rotate-[70deg] bg-zinc-200/80" />
  </>
);
