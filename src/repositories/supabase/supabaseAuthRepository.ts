import type {
  AuthRepository,
  AuthSessionState,
  AuthUser,
  UserProfile,
  UserRole,
} from '../authRepository';
import { getSupabaseClient } from './supabaseClient';

const PROFILES_TABLE = 'profiles';

interface SupabaseProfileRow {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseAuthUserLike {
  id: string;
  email?: string | null;
}

const createAuthRepositoryError = (message: string, cause: unknown) => {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
};

const isAuthSessionMissingError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const authError = error as { name?: unknown; message?: unknown };
  return authError.name === 'AuthSessionMissingError'
    || (typeof authError.message === 'string' && authError.message.toLowerCase().includes('auth session missing'));
};

const isUserRole = (value: unknown): value is UserRole => {
  return value === 'user' || value === 'admin';
};

const mapAuthUser = (user: SupabaseAuthUserLike): AuthUser => {
  return {
    id: user.id,
    ...(user.email ? { email: user.email } : {}),
  };
};

const mapProfileRow = (row: SupabaseProfileRow): UserProfile => {
  if (!isUserRole(row.role)) {
    throw new Error('Invalid profile role returned from Supabase.');
  }

  return {
    id: row.id,
    role: row.role,
    ...(row.display_name?.trim() ? { displayName: row.display_name.trim() } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const createSessionState = (user: AuthUser | null, profile: UserProfile | null): AuthSessionState => {
  return {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
  };
};

export const supabaseAuthRepository: AuthRepository = {
  async getCurrentUser() {
    const { data, error } = await getSupabaseClient().auth.getUser();

    if (error) {
      if (isAuthSessionMissingError(error)) {
        return null;
      }

      throw createAuthRepositoryError('Failed to get the current Supabase user.', error);
    }

    return data.user ? mapAuthUser(data.user) : null;
  },

  async getCurrentProfile() {
    const user = await this.getCurrentUser();

    if (!user) {
      return null;
    }

    const { data, error } = await getSupabaseClient()
      .from(PROFILES_TABLE)
      .select('id, role, display_name, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw createAuthRepositoryError('Failed to get the current user profile from Supabase.', error);
    }

    return data ? mapProfileRow(data as SupabaseProfileRow) : null;
  },

  async getSessionState() {
    const user = await this.getCurrentUser();

    if (!user) {
      return createSessionState(null, null);
    }

    const profile = await this.getCurrentProfile();
    return createSessionState(user, profile);
  },

  async isCurrentUserAdmin() {
    const profile = await this.getCurrentProfile();
    return profile?.role === 'admin';
  },

  async signInWithPassword(email, password) {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });

    if (error) {
      throw createAuthRepositoryError('Failed to sign in with Supabase password auth.', error);
    }

    return this.getSessionState();
  },

  async signOut() {
    const { error } = await getSupabaseClient().auth.signOut();

    if (error) {
      throw createAuthRepositoryError('Failed to sign out from Supabase auth.', error);
    }
  },
};
