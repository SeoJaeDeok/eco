import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PAGE_FADE } from '../utils/pageTransition';
import { Hero } from './Hero';
import { IntroPage } from './IntroPage';
import { MapPage } from './MapPage';
import { ObservationListPage } from './ObservationListPage';
import { UploadMockPage } from './UploadMockPage';
import { UploadLoginGate } from './auth/UploadLoginGate';
import type { PublicSignUpResult } from './auth/PublicLoginPanel';
import type { AuthSessionState } from '../repositories/authRepository';
import type { Observation, PageId } from '../types';

const AdminPage = lazy(() => import('./admin/AdminPage').then((module) => ({ default: module.AdminPage })));

interface AppRoutesProps {
  currentPage: PageId;
  observations: Observation[];
  observationRevision: number;
  publicAuthState: AuthSessionState;
  isCheckingPublicAuth: boolean;
  isPublicAuthConfigured: boolean;
  publicAuthError: string | null;
  publicAuthNotice: string | null;
  isSigningInPublic: boolean;
  isSigningUpPublic: boolean;
  onNavigate: (page: PageId) => void;
  onSelectObservation: (obs: Observation) => void;
  onObservationCreated: (observation: Observation) => void;
  onPublicSignIn: (email: string, password: string) => Promise<boolean>;
  onPublicSignUp: (email: string, password: string, displayName: string) => Promise<PublicSignUpResult>;
}

export const AppRoutes = ({
  currentPage,
  observations,
  observationRevision,
  publicAuthState,
  isCheckingPublicAuth,
  isPublicAuthConfigured,
  publicAuthError,
  publicAuthNotice,
  isSigningInPublic,
  isSigningUpPublic,
  onNavigate,
  onSelectObservation,
  onObservationCreated,
  onPublicSignIn,
  onPublicSignUp,
}: AppRoutesProps) => {
  const isPublicUserSignedIn = Boolean(publicAuthState.user);

  return (
    <AnimatePresence mode="wait">
      {currentPage === 'home' && (
        <motion.div key="home" {...PAGE_FADE}>
          <Hero />
        </motion.div>
      )}
      {currentPage === 'intro' && (
        <motion.div key="intro" {...PAGE_FADE}>
          <IntroPage observations={observations} onSelectSpecimen={onSelectObservation} onNavigate={onNavigate} />
        </motion.div>
      )}
      {currentPage === 'observations' && (
        <motion.div key="observations" {...PAGE_FADE}>
          <ObservationListPage revision={observationRevision} onSelect={onSelectObservation} />
        </motion.div>
      )}
      {currentPage === 'map' && (
        <motion.div key="map" {...PAGE_FADE}>
          <MapPage observations={observations} onSelect={onSelectObservation} />
        </motion.div>
      )}
      {currentPage === 'upload' && (
        <motion.div key="upload" {...PAGE_FADE}>
          {isPublicUserSignedIn ? (
            <UploadMockPage onCancel={() => onNavigate('observations')} onObservationCreated={onObservationCreated} />
          ) : (
            <UploadLoginGate
              errorMessage={publicAuthError}
              noticeMessage={publicAuthNotice}
              isAuthConfigured={isPublicAuthConfigured}
              isCheckingAuth={isCheckingPublicAuth}
              isSigningIn={isSigningInPublic}
              isSigningUp={isSigningUpPublic}
              onSignIn={onPublicSignIn}
              onSignUp={onPublicSignUp}
              onNavigateHome={() => onNavigate('observations')}
            />
          )}
        </motion.div>
      )}
      {currentPage === 'admin' && (
        <motion.div key="admin" {...PAGE_FADE}>
          <Suspense fallback={<div className="min-h-screen bg-white px-6 pt-32 text-sm text-zinc-500">관리자 화면을 불러오는 중입니다.</div>}>
            <AdminPage />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
