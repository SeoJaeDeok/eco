import type { AuthRepository, AuthSessionState } from './authRepository';

const SUPABASE_URL_ENV_KEY = 'VITE_SUPABASE_URL';
const SUPABASE_ANON_KEY_ENV_KEY = 'VITE_SUPABASE_ANON_KEY';

type AuthRepositoryKind = 'supabase' | 'unavailable';

type ViteImportMeta = ImportMeta & {
  env: Record<string, string | undefined>;
};

const createEmptySessionState = (): AuthSessionState => ({
  user: null,
  profile: null,
  isAdmin: false,
});

const createUnavailableAuthError = () => {
  return new Error('Public authentication is not configured for this environment.');
};

const unavailableAuthRepository: AuthRepository = {
  async getCurrentUser() {
    return null;
  },
  async getCurrentProfile() {
    return null;
  },
  async getSessionState() {
    return createEmptySessionState();
  },
  async isCurrentUserAdmin() {
    return false;
  },
  async signInWithPassword() {
    throw createUnavailableAuthError();
  },
  async signOut() {
    return undefined;
  },
};

const loadSupabaseAuthRepository = async (): Promise<AuthRepository> => {
  const module = await import('./supabase/supabaseAuthRepository');
  return module.supabaseAuthRepository;
};

const lazySupabaseAuthRepository: AuthRepository = {
  async getCurrentUser() {
    const repository = await loadSupabaseAuthRepository();
    return repository.getCurrentUser();
  },
  async getCurrentProfile() {
    const repository = await loadSupabaseAuthRepository();
    return repository.getCurrentProfile();
  },
  async getSessionState() {
    const repository = await loadSupabaseAuthRepository();
    return repository.getSessionState();
  },
  async isCurrentUserAdmin() {
    const repository = await loadSupabaseAuthRepository();
    return repository.isCurrentUserAdmin();
  },
  async signInWithPassword(email, password) {
    const repository = await loadSupabaseAuthRepository();
    return repository.signInWithPassword(email, password);
  },
  async signOut() {
    const repository = await loadSupabaseAuthRepository();
    return repository.signOut();
  },
};

const hasSupabaseAuthConfig = () => {
  const env = (import.meta as ViteImportMeta).env;
  return Boolean(env[SUPABASE_URL_ENV_KEY] && env[SUPABASE_ANON_KEY_ENV_KEY]);
};

export const getConfiguredAuthRepositoryKind = (): AuthRepositoryKind => {
  return hasSupabaseAuthConfig() ? 'supabase' : 'unavailable';
};

export const getAuthRepository = (
  kind: AuthRepositoryKind = getConfiguredAuthRepositoryKind(),
): AuthRepository => {
  switch (kind) {
    case 'supabase':
      return lazySupabaseAuthRepository;
    case 'unavailable':
      return unavailableAuthRepository;
  }
};

export const activeAuthRepository = getAuthRepository();
