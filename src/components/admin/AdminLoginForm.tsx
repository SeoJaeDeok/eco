import { useState } from 'react';

interface AdminLoginFormProps {
  errorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const AdminLoginForm = ({ errorMessage, isSubmitting, onSubmit }: AdminLoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(email, password);
    setPassword('');
  };

  return (
    <form className="border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit} id="admin-login-form">
      <div className="space-y-5">
        <div>
          <label htmlFor="admin-email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Admin email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
            placeholder="관리자 비밀번호"
          />
        </div>

        {errorMessage && (
          <p className="border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '확인 중' : '로그인'}
        </button>
      </div>
    </form>
  );
};
