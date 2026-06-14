import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  observationCount: number;
  uniqueSpeciesCount: number;
}

export const Navbar = ({ onNavigate, observationCount, uniqueSpeciesCount }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-black">
      <div className="max-w-6xl mx-auto w-full px-6 py-6 md:px-10 flex justify-between items-center">
        <div 
          className="text-[13px] font-medium tracking-[0.2em] cursor-pointer hover:opacity-60 transition-opacity"
          onClick={() => onNavigate('home')}
          id="nav-logo"
        >
          KNU BIODIVERSITY
        </div>

        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-emerald-50/50 rounded-full border border-emerald-100">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-tighter font-semibold">서버 클라우드 영구백업 완료</span>
          </div>
          <span className="text-[9px] opacity-20 font-light">|</span>
          <span className="text-[10px] font-mono opacity-60 uppercase tracking-tighter text-emerald-800 font-semibold">{observationCount} RECORD LIST</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-10 text-sm font-light">
          <button 
            onClick={() => onNavigate('intro')} 
            className="hover:opacity-100 opacity-60 transition-opacity cursor-pointer transition-all"
            id="nav-intro"
          >
            소개
          </button>
          <button 
            onClick={() => onNavigate('observations')} 
            className="hover:opacity-100 opacity-60 transition-opacity cursor-pointer transition-all"
            id="nav-observations"
          >
            관찰목록
          </button>
          <button 
            onClick={() => onNavigate('map')} 
            className="hover:opacity-100 opacity-60 transition-opacity cursor-pointer transition-all"
            id="nav-map"
          >
            생태지도
          </button>
          <button 
            onClick={() => onNavigate('upload')} 
            className="px-4 py-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-all text-xs tracking-widest font-medium uppercase"
            id="nav-upload"
          >
            기록하기
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} id="mobile-menu-toggle">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white border-b border-gray-100 p-6 flex flex-col space-y-4 md:hidden shadow-xl"
            id="mobile-nav-menu"
          >
            <button onClick={() => { onNavigate('intro'); setIsOpen(false); }} className="text-left py-2 border-b border-gray-50">소개</button>
            <button onClick={() => { onNavigate('observations'); setIsOpen(false); }} className="text-left py-2 border-b border-gray-50">관찰목록</button>
            <button onClick={() => { onNavigate('map'); setIsOpen(false); }} className="text-left py-2 border-b border-gray-50">생태지도</button>
            <button onClick={() => { onNavigate('upload'); setIsOpen(false); }} className="text-left py-2 border-b border-gray-50">기록하기</button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
