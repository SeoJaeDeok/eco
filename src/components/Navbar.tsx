import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import type { PageId } from '../types';

interface NavbarProps {
  onNavigate: (page: PageId) => void;
  observationCount: number;
  uniqueSpeciesCount?: number;
}

export const Navbar = ({ onNavigate, observationCount, uniqueSpeciesCount }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-black">
      <div className="max-w-6xl mx-auto w-full px-6 py-6 md:px-10 flex justify-between items-center">
        <div
          className="text-[13px] font-medium tracking-[0.2em] cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => handleNavigate('home')}
          id="nav-logo"
        >
          KNU BIODIVERSITY
        </div>

        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-zinc-50/70 rounded-full border border-zinc-100">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-tighter font-semibold">정적 디자인 시안</span>
          </div>
          <span className="text-[9px] opacity-20 font-light">|</span>
          <span className="text-[10px] font-mono opacity-60 uppercase tracking-tighter text-zinc-700 font-semibold">{uniqueSpeciesCount ?? observationCount} SPECIES / {observationCount} RECORDS</span>
        </div>

        <nav className="hidden md:flex items-center space-x-10 text-sm font-light">
          <button type="button" onClick={() => handleNavigate('intro')} className="hover:opacity-100 opacity-60 transition-opacity cursor-pointer" id="nav-intro">소개</button>
          <button type="button" onClick={() => handleNavigate('observations')} className="hover:opacity-100 opacity-60 transition-opacity cursor-pointer" id="nav-observations">관찰목록</button>
          <button type="button" onClick={() => handleNavigate('map')} className="hover:opacity-100 opacity-60 transition-opacity cursor-pointer" id="nav-map">생태지도</button>
          <button type="button" onClick={() => handleNavigate('upload')} className="px-4 py-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-all text-xs tracking-widest font-medium uppercase" id="nav-upload">기록하기</button>
        </nav>

        <button type="button" className="md:hidden" onClick={() => setIsOpen(!isOpen)} id="mobile-menu-toggle" aria-label="메뉴 열기">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white border-b border-gray-100 p-6 flex flex-col space-y-4 md:hidden shadow-xl"
            id="mobile-nav-menu"
          >
            <button type="button" onClick={() => handleNavigate('intro')} className="text-left py-2 border-b border-gray-50">소개</button>
            <button type="button" onClick={() => handleNavigate('observations')} className="text-left py-2 border-b border-gray-50">관찰목록</button>
            <button type="button" onClick={() => handleNavigate('map')} className="text-left py-2 border-b border-gray-50">생태지도</button>
            <button type="button" onClick={() => handleNavigate('upload')} className="text-left py-2 border-b border-gray-50">기록하기</button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
