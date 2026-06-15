interface AdminSessionPanelProps {
  email?: string;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
}

export const AdminSessionPanel = ({ email, isSigningOut, onSignOut }: AdminSessionPanelProps) => {
  return (
    <section className="border border-zinc-200 bg-white p-6 shadow-sm" id="admin-session-panel">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Admin session</p>
          <h2 className="mt-3 text-2xl font-serif text-zinc-950" id="admin-login-success">
            관리자 로그인됨
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            현재 계정은 관리자 권한으로 확인되었습니다. 아래 승인 대기 목록에서 제출된 관찰 기록을 검토할 수 있습니다.
          </p>
        </div>

        {email && (
          <div className="border border-zinc-100 bg-zinc-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Signed in as</p>
            <p className="mt-1 break-all text-sm text-zinc-700">{email}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="border border-zinc-900 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          id="admin-sign-out"
        >
          {isSigningOut ? '로그아웃 중' : '로그아웃'}
        </button>
      </div>
    </section>
  );
};
