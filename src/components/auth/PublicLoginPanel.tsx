import { useState, type FormEvent } from 'react';

interface PublicLoginPanelProps {
  errorMessage: string | null;
  isAuthConfigured: boolean;
  isSubmitting: boolean;
  onSubmit: (email: string, password: string) => Promise<boolean>;
  onCancel?: () => void;
  className?: string;
  id?: string;
}

export const PublicLoginPanel = ({
  errorMessage,
  isAuthConfigured,
  isSubmitting,
  onSubmit,
  onCancel,
  className = '',
  id = 'public-login-panel',
}: PublicLoginPanelProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthConfigured || isSubmitting) {
      return;
    }

    const didSignIn = await onSubmit(email, password);
    setPassword('');

    if (didSignIn) {
      setEmail('');
      onCancel?.();
    }
  };

  return (
    <section className={`border border-zinc-200 bg-white p-5 shadow-sm ${className}`} id={id}>
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Contributor login</p>
        <h2 className="mt-2 font-serif text-xl text-zinc-950">관찰 기록 로그인</h2>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          등록된 계정으로 로그인하면 관찰 기록 화면을 사용할 수 있습니다.
        </p>
      </div>

      {!isAuthConfigured ? (
        <p className="border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-600" role="status">
          현재 환경에는 공개 로그인 설정이 없어 로그인 기능을 사용할 수 없습니다.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
              placeholder="비밀번호"
            />
          </div>

          {errorMessage && (
            <p className="border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '로그인 중' : '로그인'}
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
