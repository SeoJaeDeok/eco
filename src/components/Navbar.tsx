import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { PublicLoginPanel } from './auth/PublicLoginPanel';
import type { PageId } from '../types';

interface NavbarProps {
  onNavigate: (page: PageId) => void;
  observationCount: number;
  uniqueSpeciesCount?: number;
  publicAuthDisplayName: string;
  publicAuthError: string | null;
  isCheckingPublicAuth: boolean;
  isPublicAuthConfigured: boolean;
  isPublicUserSignedIn: boolean;
  isSigningInPublic: boolean;
  isSigningOutPublic: boolean;
  onPublicSignIn: (email: string, password: string) => Promise<boolean>;
  onPublicSignOut: () => Promise<void>;
}

export const Navbar = ({
  onNavigate,
  observationCount,
  uniqueSpeciesCount,
  publicAuthDisplayName,
  publicAuthError,
  isCheckingPublicAuth,
  isPublicAuthConfigured,
  isPublicUserSignedIn,
  isSigningInPublic,
  isSigningOutPublic,
  onPublicSignIn,
  onPublicSignOut,
}: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setIsOpen(false);
    setIsLoginOpen(false);
  };

  const handleToggleLogin = () => {
    setIsOpen(false);
    setIsLoginOpen((current) => !current);
  };

  const handlePublicSignOut = async () => {
    await onPublicSignOut();
    setIsOpen(false);
    setIsLoginOpen(false);
  };

  const renderAuthControls = (isMobile = false) => {
    if (isCheckingPublicAuth) {
      return (
        <span className={isMobile ? 'py-2 text-left text-xs text-zinc-400' : 'text-xs text-zinc-400'}>
          로그인 확인 중
        </span>
      );
    }

    if (isPublicUserSignedIn) {
      return (
        <div className={isMobile ? 'flex items-center justify-between gap-3 py-2' : 'flex items-center gap-3'}>
          <span className="text-xs font-medium text-zinc-600">{publicAuthDisplayName}</span>
          <button
            type="button"
            onClick={handlePublicSignOut}
            disabled={isSigningOutPublic}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSigningOutPublic ? '로그아웃 중' : '로그아웃'}
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleToggleLogin}
        className={isMobile
          ? 'py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:text-zinc-950'
          : 'text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:text-zinc-950'}
        aria-expanded={isLoginOpen}
        aria-controls="nav-public-login-panel"
      >
        로그인
      </button>
    );
  };

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-black bg-white/80 backdrop-blur-sm">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <div
          className="cursor-pointer text-[13px] font-medium tracking-[0.2em] transition-opacity hover:opacity-60"
          onClick={() => handleNavigate('home')}
          id="nav-logo"
        >
          KNU BIODIVERSITY
        </div>

        <div className="hidden items-center gap-3 rounded-full border border-zinc-100 bg-zinc-50/70 px-3 py-1 lg:flex">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-tighter text-zinc-700">정적 디자인 시안</span>
          </div>
          <span className="text-[9px] font-light opacity-20">|</span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-tighter text-zinc-700 opacity-60">{uniqueSpeciesCount ?? observationCount} SPECIES / {observationCount} RECORDS</span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-light md:flex">
          <div className="flex items-center gap-10">
            <button type="button" onClick={() => handleNavigate('intro')} className="cursor-pointer opacity-60 transition-opacity hover:opacity-100" id="nav-intro">소개</button>
            <button type="button" onClick={() => handleNavigate('observations')} className="cursor-pointer opacity-60 transition-opacity hover:opacity-100" id="nav-observations">관찰목록</button>
            <button type="button" onClick={() => handleNavigate('map')} className="cursor-pointer opacity-60 transition-opacity hover:opacity-100" id="nav-map">생태지도</button>
            <button type="button" onClick={() => handleNavigate('upload')} className="border border-black bg-white px-4 py-2 text-xs font-medium uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white" id="nav-upload">기록하기</button>
          </div>
          <div className="border-l border-zinc-200 pl-5">
            {renderAuthControls()}
          </div>
        </nav>

        <button type="button" className="md:hidden" onClick={() => setIsOpen(!isOpen)} id="mobile-menu-toggle" aria-label="메뉴 열기">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <AnimatePresence>
          {isLoginOpen && !isPublicUserSignedIn && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-6 top-full mt-3 w-[min(22rem,calc(100vw-3rem))] md:right-10"
            >
              <PublicLoginPanel
                errorMessage={publicAuthError}
                isAuthConfigured={isPublicAuthConfigured}
                isSubmitting={isSigningInPublic}
                onSubmit={onPublicSignIn}
                onCancel={() => setIsLoginOpen(false)}
                id="nav-public-login-panel"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 flex w-full flex-col space-y-4 border-b border-gray-100 bg-white p-6 shadow-xl md:hidden"
            id="mobile-nav-menu"
          >
            <button type="button" onClick={() => handleNavigate('intro')} className="border-b border-gray-50 py-2 text-left">소개</button>
            <button type="button" onClick={() => handleNavigate('observations')} className="border-b border-gray-50 py-2 text-left">관찰목록</button>
            <button type="button" onClick={() => handleNavigate('map')} className="border-b border-gray-50 py-2 text-left">생태지도</button>
            <button type="button" onClick={() => handleNavigate('upload')} className="border-b border-gray-50 py-2 text-left">기록하기</button>
            <div className="border-t border-zinc-100 pt-3">
              {renderAuthControls(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
