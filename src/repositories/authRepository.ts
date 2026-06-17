export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSessionState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
}

export interface SignUpWithPasswordInput {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthSignUpResult {
  sessionState: AuthSessionState;
  requiresEmailConfirmation: boolean;
  profileSetupRequired: boolean;
}

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;
  getCurrentProfile(): Promise<UserProfile | null>;
  getSessionState(): Promise<AuthSessionState>;
  isCurrentUserAdmin(): Promise<boolean>;
  signInWithPassword(email: string, password: string): Promise<AuthSessionState>;
  signUpWithPassword(input: SignUpWithPasswordInput): Promise<AuthSignUpResult>;
  signOut(): Promise<void>;
}
