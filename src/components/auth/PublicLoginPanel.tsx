import { useState, type FormEvent } from 'react';
import { normalizeObserverDisplayName } from '../../utils/observerDisplay';

export type PublicSignUpResult = 'signed-in' | 'confirmation-required' | 'profile-setup-required' | 'failed';

interface PublicLoginPanelProps {
  errorMessage: string | null;
  noticeMessage?: string | null;
  isAuthConfigured: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<PublicSignUpResult>;
  onCancel?: () => void;
  className?: string;
  id?: string;
}

type AuthPanelMode = 'login' | 'signup';

const MIN_PASSWORD_LENGTH = 6;

const getModeButtonClassName = (active: boolean) => {
  return `border-b pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
    active ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-400 hover:text-zinc-700'
  }`;
};

export const PublicLoginPanel = ({
  errorMessage,
  noticeMessage = null,
  isAuthConfigured,
  isSigningIn,
  isSigningUp,
  onSignIn,
  onSignUp,
  onCancel,
  className = '',
  id = 'public-login-panel',
}: PublicLoginPanelProps) => {
  const [mode, setMode] = useState<AuthPanelMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const isSubmitting = isSigningIn || isSigningUp;

  const resetPasswords = () => {
    setPassword('');
    setPasswordConfirmation('');
  };

  const handleModeChange = (nextMode: AuthPanelMode) => {
    setMode(nextMode);
    setLocalError(null);
    resetPasswords();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthConfigured || isSubmitting) {
      return;
    }

    setLocalError(null);

    if (mode === 'login') {
      const didSignIn = await onSignIn(email, password);
      resetPasswords();

      if (didSignIn) {
        setEmail('');
        setDisplayName('');
        onCancel?.();
      }

      return;
    }

    const safeDisplayName = normalizeObserverDisplayName(displayName);

    if (!safeDisplayName) {
      setLocalError('공개 별명에는 이메일 주소를 사용할 수 없습니다.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상으로 입력해 주세요.`);
      return;
    }

    if (password !== passwordConfirmation) {
      setLocalError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const signUpResult = await onSignUp(email, password, safeDisplayName);
    resetPasswords();

    if (signUpResult === 'signed-in') {
      setEmail('');
      setDisplayName('');
      onCancel?.();
    }
  };

  return (
    <section className={`border border-zinc-200 bg-white p-5 shadow-sm ${className}`} id={id}>
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Contributor access</p>
        <h2 className="mt-2 font-serif text-xl text-zinc-950">
          {mode === 'login' ? '관찰 기록 로그인' : '관찰자 회원가입'}
        </h2>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {mode === 'login'
            ? '등록된 계정으로 로그인하면 관찰 기록 화면을 사용할 수 있습니다.'
            : '공개 관찰자 별명은 목록과 상세 화면에 표시되며, 이메일 주소는 표시하지 않습니다.'}
        </p>
      </div>

      <div className="mb-5 flex items-center gap-5">
        <button
          type="button"
          onClick={() => handleModeChange('login')}
          className={getModeButtonClassName(mode === 'login')}
          aria-pressed={mode === 'login'}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('signup')}
          className={getModeButtonClassName(mode === 'signup')}
          aria-pressed={mode === 'signup'}
        >
          회원가입
        </button>
      </div>

      {!isAuthConfigured ? (
        <p className="border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-600" role="status">
          현재 환경에는 공개 로그인 설정이 없어 로그인과 회원가입 기능을 사용할 수 없습니다.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div>
              <label htmlFor={`${id}-display-name`} className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                공개 별명
              </label>
              <input
                id={`${id}-display-name`}
                name="displayName"
                type="text"
                autoComplete="nickname"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
                placeholder="목록에 표시할 별명"
              />
            </div>
          )}

          <div>
            <label htmlFor={`${id}-email`} className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              이메일
            </label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
              placeholder="계정 이메일"
            />
          </div>

          <div>
            <label htmlFor={`${id}-password`} className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              비밀번호
            </label>
            <input
              id={`${id}-password`}
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
              className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
              placeholder="비밀번호"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label htmlFor={`${id}-password-confirmation`} className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                비밀번호 확인
              </label>
              <input
                id={`${id}-password-confirmation`}
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
                placeholder="비밀번호 재입력"
              />
            </div>
          )}

          {(localError || errorMessage) && (
            <p className="border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700" role="alert">
              {localError ?? errorMessage}
            </p>
          )}

          {noticeMessage && (
            <p className="border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800" role="status">
              {noticeMessage}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '처리 중' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-2 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-950"
              >
                닫기
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
};
