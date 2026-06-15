import { useEffect, useState } from 'react';
import { AdminLoginForm } from './AdminLoginForm';
import { AdminSessionPanel } from './AdminSessionPanel';
import { supabaseAuthRepository } from '../../repositories/supabase/supabaseAuthRepository';
import type { AuthSessionState } from '../../repositories/authRepository';

const createEmptySessionState = (): AuthSessionState => ({
  user: null,
  profile: null,
  isAdmin: false,
});

export const AdminPage = () => {
  const [sessionState, setSessionState] = useState<AuthSessionState>(() => createEmptySessionState());
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadSession = async () => {
      try {
        setIsCheckingSession(true);
        setAuthError(null);
        const nextSessionState = await supabaseAuthRepository.getSessionState();

        if (!isCurrent) return;
        setSessionState(nextSessionState);
      } catch {
        if (!isCurrent) return;
        setSessionState(createEmptySessionState());
        setAuthError('관리자 인증 설정을 확인해 주세요.');
      } finally {
        if (isCurrent) {
          setIsCheckingSession(false);
        }
      }
    };

    void loadSession();

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      const nextSessionState = await supabaseAuthRepository.signInWithPassword(email, password);
      setSessionState(nextSessionState);

      if (!nextSessionState.isAdmin) {
        setAuthError('관리자 권한이 없는 계정입니다.');
      }
    } catch {
      setSessionState(createEmptySessionState());
      setAuthError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setAuthError(null);
      await supabaseAuthRepository.signOut();
      setSessionState(createEmptySessionState());
    } catch {
      setAuthError('로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const isSignedIn = Boolean(sessionState.user);
  const isUnauthorized = isSignedIn && !sessionState.isAdmin;

  return (
    <section className="min-h-screen bg-zinc-50 px-6 pb-20 pt-32 md:px-10" id="admin-page">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 border-b border-zinc-200 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Hidden admin route</p>
          <h1 className="mt-4 text-4xl font-serif text-zinc-950 md:text-5xl">관리자 접근</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600">
            관찰 기록 승인 기능을 위한 관리자 전용 진입점입니다. 이 화면은 공개 내비게이션에 표시되지 않습니다.
          </p>
        </div>

        {isCheckingSession && (
          <div className="border border-zinc-200 bg-white p-6 text-sm text-zinc-500" id="admin-session-loading">
            관리자 세션을 확인하는 중입니다.
          </div>
        )}

        {!isCheckingSession && !isSignedIn && (
          <AdminLoginForm errorMessage={authError} isSubmitting={isSigningIn} onSubmit={handleSignIn} />
        )}

        {!isCheckingSession && sessionState.isAdmin && (
          <AdminSessionPanel email={sessionState.user?.email} isSigningOut={isSigningOut} onSignOut={handleSignOut} />
        )}

        {!isCheckingSession && isUnauthorized && (
          <section className="border border-zinc-200 bg-white p-6 shadow-sm" id="admin-unauthorized">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">Access denied</p>
            <h2 className="mt-3 text-2xl font-serif text-zinc-950">권한 없음</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              현재 로그인한 계정에는 관리자 권한이 없습니다. 관리자 계정으로 다시 로그인해 주세요.
            </p>

            {authError && (
              <p className="mt-4 border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700" role="alert">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-5 border border-zinc-900 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              id="admin-unauthorized-sign-out"
            >
              {isSigningOut ? '로그아웃 중' : '로그아웃'}
            </button>
          </section>
        )}
      </div>
    </section>
  );
};
