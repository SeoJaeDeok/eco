import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Hero } from './Hero';
import { IntroPage } from './IntroPage';
import { MapPage } from './MapPage';
import { ObservationListPage } from './ObservationListPage';
import { UploadMockPage } from './UploadMockPage';
import { UploadLoginGate } from './auth/UploadLoginGate';
import type { AuthSessionState } from '../repositories/authRepository';
import type { Observation, PageId } from '../types';

const AdminPage = lazy(() => import('./admin/AdminPage').then((module) => ({ default: module.AdminPage })));

interface AppRoutesProps {
  currentPage: PageId;
  observations: Observation[];
  publicAuthState: AuthSessionState;
  isCheckingPublicAuth: boolean;
  isPublicAuthConfigured: boolean;
  publicAuthError: string | null;
  isSigningInPublic: boolean;
  onNavigate: (page: PageId) => void;
  onSelectObservation: (obs: Observation) => void;
  onObservationCreated: (observation: Observation) => void;
  onPublicSignIn: (email: string, password: string) => Promise<boolean>;
}

export const AppRoutes = ({
  currentPage,
  observations,
  publicAuthState,
  isCheckingPublicAuth,
  isPublicAuthConfigured,
  publicAuthError,
  isSigningInPublic,
  onNavigate,
  onSelectObservation,
  onObservationCreated,
  onPublicSignIn,
}: AppRoutesProps) => {
  const isPublicUserSignedIn = Boolean(publicAuthState.user);

  return (
    <AnimatePresence mode="wait">
      {currentPage === 'home' && (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Hero />
        </motion.div>
      )}
      {currentPage === 'intro' && (
        <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <IntroPage observations={observations} onSelectSpecimen={onSelectObservation} onNavigate={onNavigate} />
        </motion.div>
      )}
      {currentPage === 'observations' && (
        <motion.div key="observations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ObservationListPage observations={observations} onSelect={onSelectObservation} />
        </motion.div>
      )}
      {currentPage === 'map' && (
        <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <MapPage observations={observations} onSelect={onSelectObservation} />
        </motion.div>
      )}
      {currentPage === 'upload' && (
        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {isPublicUserSignedIn ? (
            <UploadMockPage onCancel={() => onNavigate('observations')} onObservationCreated={onObservationCreated} />
          ) : (
            <UploadLoginGate
              errorMessage={publicAuthError}
              isAuthConfigured={isPublicAuthConfigured}
              isCheckingAuth={isCheckingPublicAuth}
              isSigningIn={isSigningInPublic}
              onSignIn={onPublicSignIn}
              onNavigateHome={() => onNavigate('observations')}
            />
          )}
        </motion.div>
      )}
      {currentPage === 'admin' && (
        <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Suspense fallback={<div className="min-h-screen bg-white px-6 pt-32 text-sm text-zinc-500">관리자 화면을 불러오는 중입니다.</div>}>
            <AdminPage />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
