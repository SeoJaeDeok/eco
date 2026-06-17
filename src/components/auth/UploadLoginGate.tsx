import { PublicLoginPanel, type PublicSignUpResult } from './PublicLoginPanel';

interface UploadLoginGateProps {
  errorMessage: string | null;
  noticeMessage: string | null;
  isAuthConfigured: boolean;
  isCheckingAuth: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<PublicSignUpResult>;
  onNavigateHome: () => void;
}

export const UploadLoginGate = ({
  errorMessage,
  noticeMessage,
  isAuthConfigured,
  isCheckingAuth,
  isSigningIn,
  isSigningUp,
  onSignIn,
  onSignUp,
  onNavigateHome,
}: UploadLoginGateProps) => {
  return (
    <section className="min-h-screen px-6 pb-20 pt-32 md:px-20" id="upload-login-gate">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.7fr)] lg:items-start">
        <div className="border-b border-zinc-200 pb-8 lg:border-b-0 lg:pb-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Contributor access</p>
          <h1 className="mt-4 font-serif text-4xl text-zinc-950 md:text-5xl">로그인 후 기록하기</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-600">
            관찰 기록은 등록된 계정으로 로그인한 뒤 남길 수 있습니다. 로그인하지 않아도 공개된 관찰 목록과 생태지도는 계속 열람할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="mt-6 border border-zinc-300 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950"
          >
            공개 목록으로 돌아가기
          </button>
        </div>

        {isCheckingAuth ? (
          <div className="border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm" role="status">
            로그인 상태를 확인하는 중입니다.
          </div>
        ) : (
          <PublicLoginPanel
            errorMessage={errorMessage}
            noticeMessage={noticeMessage}
            isAuthConfigured={isAuthConfigured}
            isSigningIn={isSigningIn}
            isSigningUp={isSigningUp}
            onSignIn={onSignIn}
            onSignUp={onSignUp}
            id="upload-public-login-panel"
          />
        )}
      </div>
    </section>
  );
};
