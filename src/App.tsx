import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { AppRoutes } from './components/AppRoutes';
import { ObservationDetail } from './components/ObservationDetail';
import type { PublicSignUpResult } from './components/auth/PublicLoginPanel';
import { activeAuthRepository, getConfiguredAuthRepositoryKind } from './repositories/authRepositoryProvider';
import { activeAdminObservationRepository } from './repositories/adminObservationRepositoryProvider';
import { activeObservationRepository, getConfiguredObservationRepositoryKind } from './repositories/observationRepositoryProvider';
import {
  invalidateObservationImageCache,
  prefetchObservationImage,
  prefetchObservationImages,
  withCachedObservationImageUrl,
} from './utils/observationImagePrefetch';
import { normalizeObserverDisplayName } from './utils/observerDisplay';
import { countUniqueSpecies } from './utils/observationStats';
import type { AuthSessionState } from './repositories/authRepository';
import type { Observation, OwnerObservationUpdateInput, PageId } from './types';

const ADMIN_HASH = '#admin';
const PUBLIC_AUTH_CONFIGURED = getConfiguredAuthRepositoryKind() === 'supabase';
const IS_SUPABASE_OBSERVATION_REPOSITORY = getConfiguredObservationRepositoryKind() === 'supabase';
const PUBLIC_AUTH_SIGN_UP_ERROR = '회원가입을 완료하지 못했습니다. 입력한 정보와 계정 상태를 확인해 주세요.';
const PUBLIC_AUTH_SIGN_UP_SUCCESS_NOTICE = '회원가입이 완료되었습니다. 바로 관찰 기록을 등록할 수 있습니다.';
const PUBLIC_AUTH_SIGN_UP_CONFIRMATION_NOTICE = '회원가입 요청이 접수되었습니다. 이메일 확인을 완료한 뒤 로그인해 주세요.';
const PUBLIC_AUTH_PROFILE_SETUP_NOTICE = '회원가입은 접수되었지만 관찰자 프로필 준비가 필요합니다. 관리자에게 프로필 설정을 요청해 주세요.';
const PUBLIC_AUTH_SESSION_ERROR = '로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.';
const PUBLIC_AUTH_SIGN_IN_ERROR = '로그인에 실패했습니다. 계정 정보를 확인해 주세요.';
const PUBLIC_AUTH_SIGN_OUT_ERROR = '로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.';

const createEmptyAuthSessionState = (): AuthSessionState => ({
  user: null,
  profile: null,
  isAdmin: false,
});

const getInitialPage = (): PageId => {
  if (typeof window !== 'undefined' && window.location.hash === ADMIN_HASH) {
    return 'admin';
  }

  return 'home';
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(() => getInitialPage());
  const [observations, setObservations] = useState<Observation[]>([]);
  const [uniqueSpeciesCount, setUniqueSpeciesCount] = useState(0);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [isLoadingObservations, setIsLoadingObservations] = useState(true);
  const [observationLoadError, setObservationLoadError] = useState<string | null>(null);
  const [publicAuthState, setPublicAuthState] = useState<AuthSessionState>(() => createEmptyAuthSessionState());
  const [isCheckingPublicAuth, setIsCheckingPublicAuth] = useState(true);
  const [isSigningInPublic, setIsSigningInPublic] = useState(false);
  const [isSigningUpPublic, setIsSigningUpPublic] = useState(false);
  const [isSigningOutPublic, setIsSigningOutPublic] = useState(false);
  const [publicAuthError, setPublicAuthError] = useState<string | null>(null);
  const [publicAuthNotice, setPublicAuthNotice] = useState<string | null>(null);
  const imageRefreshRetryKeysRef = useRef(new Set<string>());

  useEffect(() => {
    let isCurrent = true;

    const loadObservations = async () => {
      try {
        setIsLoadingObservations(true);
        setObservationLoadError(null);
        const [nextObservations, nextUniqueSpeciesCount] = await Promise.all([
          activeObservationRepository.listObservations(),
          activeObservationRepository.countUniqueSpecies(),
        ]);

        if (!isCurrent) return;
        setObservations(nextObservations);
        setUniqueSpeciesCount(nextUniqueSpeciesCount);
        void prefetchObservationImages(nextObservations);
      } catch {
        if (!isCurrent) return;
        setObservationLoadError('관찰 데이터를 불러오지 못했습니다.');
      } finally {
        if (isCurrent) {
          setIsLoadingObservations(false);
        }
      }
    };

    void loadObservations();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadPublicAuthState = async () => {
      try {
        setIsCheckingPublicAuth(true);
        setPublicAuthError(null);
        setPublicAuthNotice(null);
        const nextSessionState = await activeAuthRepository.getSessionState();

        if (!isCurrent) return;
        setPublicAuthState(nextSessionState);
      } catch {
        if (!isCurrent) return;
        setPublicAuthState(createEmptyAuthSessionState());
        setPublicAuthError(PUBLIC_AUTH_SESSION_ERROR);
      } finally {
        if (isCurrent) {
          setIsCheckingPublicAuth(false);
        }
      }
    };

    void loadPublicAuthState();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const syncPageFromHash = () => {
      if (window.location.hash === ADMIN_HASH) {
        setCurrentPage('admin');
        setSelectedObservation(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setCurrentPage((page) => (page === 'admin' ? 'home' : page));
    };

    window.addEventListener('hashchange', syncPageFromHash);

    return () => {
      window.removeEventListener('hashchange', syncPageFromHash);
    };
  }, []);

  const navigate = (page: PageId) => {
    if (page === 'admin') {
      window.location.hash = 'admin';
    } else if (window.location.hash === ADMIN_HASH) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    setCurrentPage(page);
    setSelectedObservation(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectObservation = useCallback((observation: Observation) => {
    const cachedObservation = withCachedObservationImageUrl(observation);
    setSelectedObservation(cachedObservation);
    void prefetchObservationImage(cachedObservation).catch(() => undefined);

    void activeObservationRepository.getObservationById(observation.id)
      .then((refreshedObservation) => {
        if (!refreshedObservation) return;
        const nextObservation = withCachedObservationImageUrl(refreshedObservation);
        void prefetchObservationImage(nextObservation).catch(() => undefined);

        setSelectedObservation((currentObservation) => {
          return currentObservation?.id === observation.id ? nextObservation : currentObservation;
        });
      })
      .catch(() => {
        // Keep the already selected row if refresh fails; the repository hides provider details.
      });
  }, []);

  const handleSelectedObservationImageError = useCallback((observation: Observation) => {
    const retryKey = `${observation.id}:${observation.imagePath ?? 'legacy-image-url'}`;

    if (imageRefreshRetryKeysRef.current.has(retryKey)) {
      return;
    }

    imageRefreshRetryKeysRef.current.add(retryKey);
    invalidateObservationImageCache(observation);

    void activeObservationRepository.getObservationById(observation.id)
      .then((refreshedObservation) => {
        if (!refreshedObservation) return;

        setSelectedObservation((currentObservation) => {
          if (currentObservation?.id !== observation.id) {
            return currentObservation;
          }

          void prefetchObservationImage(refreshedObservation).catch(() => undefined);
          return refreshedObservation;
        });
      })
      .catch(() => {
        // The placeholder remains visible if the repository cannot refresh the runtime URL.
      });
  }, []);

  const handleObservationCreated = useCallback((observation: Observation) => {
    if (observation.status !== 'approved') {
      return;
    }

    void prefetchObservationImage(observation).catch(() => undefined);

    setObservations((currentObservations) => {
      const nextObservations = [
        observation,
        ...currentObservations.filter((currentObservation) => currentObservation.id !== observation.id),
      ];
      setUniqueSpeciesCount(countUniqueSpecies(nextObservations));
      return nextObservations;
    });
  }, []);

  const handleObservationUpdated = useCallback(async (id: string, input: OwnerObservationUpdateInput) => {
    const updatedObservation = publicAuthState.isAdmin
      ? await activeAdminObservationRepository.updateObservationAsAdmin(id, input)
      : await activeObservationRepository.updateOwnObservation(id, input);

    void prefetchObservationImage(updatedObservation).catch(() => undefined);

    setObservations((currentObservations) => {
      const nextObservations = currentObservations.map((currentObservation) => {
        return currentObservation.id === updatedObservation.id ? updatedObservation : currentObservation;
      });

      setUniqueSpeciesCount(countUniqueSpecies(nextObservations));
      return nextObservations;
    });

    setSelectedObservation((currentObservation) => {
      return currentObservation?.id === updatedObservation.id ? updatedObservation : currentObservation;
    });

    return updatedObservation;
  }, [publicAuthState.isAdmin]);

  const handlePublicSignIn = useCallback(async (email: string, password: string) => {
    if (!PUBLIC_AUTH_CONFIGURED) {
      setPublicAuthError('현재 환경에는 공개 로그인 설정이 없습니다.');
      return false;
    }

    try {
      setIsSigningInPublic(true);
      setPublicAuthError(null);
      setPublicAuthNotice(null);
      const nextSessionState = await activeAuthRepository.signInWithPassword(email, password);
      setPublicAuthState(nextSessionState);

      if (!nextSessionState.user) {
        setPublicAuthError(PUBLIC_AUTH_SIGN_IN_ERROR);
        return false;
      }

      return true;
    } catch {
      setPublicAuthState(createEmptyAuthSessionState());
      setPublicAuthError(PUBLIC_AUTH_SIGN_IN_ERROR);
      return false;
    } finally {
      setIsSigningInPublic(false);
    }
  }, []);

  const handlePublicSignUp = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<PublicSignUpResult> => {
    if (!PUBLIC_AUTH_CONFIGURED) {
      setPublicAuthError('현재 환경에는 공개 회원가입 설정이 없습니다.');
      setPublicAuthNotice(null);
      return 'failed';
    }

    try {
      setIsSigningUpPublic(true);
      setPublicAuthError(null);
      setPublicAuthNotice(null);
      const result = await activeAuthRepository.signUpWithPassword({ email, password, displayName });
      setPublicAuthState(result.sessionState);

      if (result.requiresEmailConfirmation) {
        setPublicAuthNotice(PUBLIC_AUTH_SIGN_UP_CONFIRMATION_NOTICE);
        return 'confirmation-required';
      }

      if (result.profileSetupRequired) {
        setPublicAuthNotice(PUBLIC_AUTH_PROFILE_SETUP_NOTICE);
        return 'profile-setup-required';
      }

      if (!result.sessionState.user) {
        setPublicAuthError(PUBLIC_AUTH_SIGN_UP_ERROR);
        return 'failed';
      }

      setPublicAuthNotice(PUBLIC_AUTH_SIGN_UP_SUCCESS_NOTICE);
      return 'signed-in';
    } catch {
      setPublicAuthState(createEmptyAuthSessionState());
      setPublicAuthError(PUBLIC_AUTH_SIGN_UP_ERROR);
      setPublicAuthNotice(null);
      return 'failed';
    } finally {
      setIsSigningUpPublic(false);
    }
  }, []);

  const handlePublicSignOut = useCallback(async () => {
    try {
      setIsSigningOutPublic(true);
      setPublicAuthError(null);
      setPublicAuthNotice(null);
      await activeAuthRepository.signOut();
      setPublicAuthState(createEmptyAuthSessionState());
    } catch {
      setPublicAuthError(PUBLIC_AUTH_SIGN_OUT_ERROR);
    } finally {
      setIsSigningOutPublic(false);
    }
  }, []);

  const publicAuthDisplayName = normalizeObserverDisplayName(publicAuthState.profile?.displayName) ?? '사용자';
  const canEditSelectedObservation = Boolean(
    selectedObservation
      && publicAuthState.user
      && (
        selectedObservation.observerId === publicAuthState.user.id
        || (publicAuthState.isAdmin && IS_SUPABASE_OBSERVATION_REPOSITORY)
      ),
  );

  return (
    <div className="relative min-h-screen bg-white" id="app-root">
      {currentPage === 'home' && (
        <div
          className="fixed inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000")' }}
        />
      )}

      <Navbar
        onNavigate={navigate}
        observationCount={observations.length}
        uniqueSpeciesCount={uniqueSpeciesCount}
        publicAuthDisplayName={publicAuthDisplayName}
        publicAuthError={publicAuthError}
        publicAuthNotice={publicAuthNotice}
        isCheckingPublicAuth={isCheckingPublicAuth}
        isPublicAuthConfigured={PUBLIC_AUTH_CONFIGURED}
        isPublicUserSignedIn={Boolean(publicAuthState.user)}
        isSigningInPublic={isSigningInPublic}
        isSigningUpPublic={isSigningUpPublic}
        isSigningOutPublic={isSigningOutPublic}
        onPublicSignIn={handlePublicSignIn}
        onPublicSignUp={handlePublicSignUp}
        onPublicSignOut={handlePublicSignOut}
      />

      <main className="relative z-10">
        {isLoadingObservations && <p className="sr-only">관찰 데이터를 불러오는 중입니다.</p>}
        {observationLoadError && (
          <div className="fixed left-1/2 top-24 z-50 -translate-x-1/2 border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600 shadow-sm">
            {observationLoadError}
          </div>
        )}
        {publicAuthNotice && publicAuthState.user && (
          <div className="fixed left-1/2 top-24 z-50 -translate-x-1/2 border border-emerald-100 bg-white px-4 py-2 text-xs text-emerald-700 shadow-sm" role="status">
            {publicAuthNotice}
          </div>
        )}
        <AppRoutes
          currentPage={currentPage}
          observations={observations}
          publicAuthState={publicAuthState}
          isCheckingPublicAuth={isCheckingPublicAuth}
          isPublicAuthConfigured={PUBLIC_AUTH_CONFIGURED}
          publicAuthError={publicAuthError}
          publicAuthNotice={publicAuthNotice}
          isSigningInPublic={isSigningInPublic}
          isSigningUpPublic={isSigningUpPublic}
          onNavigate={navigate}
          onSelectObservation={handleSelectObservation}
          onObservationCreated={handleObservationCreated}
          onPublicSignIn={handlePublicSignIn}
          onPublicSignUp={handlePublicSignUp}
        />
      </main>

      <AnimatePresence>
        {selectedObservation && (
          <ObservationDetail
            observation={selectedObservation}
            canEdit={canEditSelectedObservation}
            onClose={() => setSelectedObservation(null)}
            onUpdateObservation={handleObservationUpdated}
            onImageLoadError={handleSelectedObservationImageError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
