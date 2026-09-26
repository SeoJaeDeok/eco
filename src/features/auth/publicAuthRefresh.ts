import type { PageId } from '../../types';

type PublicPageId = Exclude<PageId, 'admin'>;
export type AuthRefreshNotice = 'signed-in' | 'confirmation-required' | 'profile-setup-required';

export const AUTH_REFRESH_STORAGE_KEY = 'eco.public-auth-return.v1';
export const AUTH_REFRESH_TTL_MS = 5 * 60 * 1000;
export const AUTH_REFRESH_NOTICES: Record<AuthRefreshNotice, string> = {
  'signed-in': '회원가입이 완료되었습니다. 바로 관찰 기록을 등록할 수 있습니다.',
  'confirmation-required': '회원가입 요청이 접수되었습니다. 이메일 확인을 완료한 뒤 로그인해 주세요.',
  'profile-setup-required': '회원가입은 접수되었지만 관찰자 프로필 준비가 필요합니다. 관리자에게 프로필 설정을 요청해 주세요.',
};

export interface AuthRefreshReturn {
  version: 1;
  page: PublicPageId;
  notice: AuthRefreshNotice | null;
  createdAt: number;
}

type RefreshStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
interface RefreshOptions {
  getStorage?: () => RefreshStorage;
  now?: () => number;
  reload?: () => void;
}

const publicPages: readonly string[] = ['home', 'intro', 'observations', 'map', 'upload'];
const isPublicPage = (page: unknown): page is PublicPageId => (
  typeof page === 'string' && publicPages.includes(page)
);
const isNotice = (notice: unknown): notice is AuthRefreshNotice | null => (
  notice === null || notice === 'signed-in' || notice === 'confirmation-required' || notice === 'profile-setup-required'
);
const getBrowserStorage = () => window.sessionStorage;

// Called once at the entry point, before StrictMode renders App. This is data, not an auth command.
export const consumeAuthRefreshReturn = (
  { getStorage = getBrowserStorage, now = Date.now }: RefreshOptions = {},
): AuthRefreshReturn | null => {
  try {
    const storage = getStorage();
    const raw = storage.getItem(AUTH_REFRESH_STORAGE_KEY);
    if (raw === null) return null;
    storage.removeItem(AUTH_REFRESH_STORAGE_KEY);
    if (raw.length > 512) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (Object.keys(record).length !== 4 || record.version !== 1
      || !isPublicPage(record.page) || !isNotice(record.notice)
      || typeof record.createdAt !== 'number' || !Number.isFinite(record.createdAt)) return null;
    const age = now() - record.createdAt;
    if (age < 0 || age > AUTH_REFRESH_TTL_MS) return null;
    return { version: 1, page: record.page, notice: record.notice, createdAt: record.createdAt };
  } catch {
    return null;
  }
};

export const createPublicAuthRefresh = ({
  getStorage = getBrowserStorage,
  now = Date.now,
  reload = () => window.location.reload(),
}: RefreshOptions = {}) => {
  let busy = false;
  let reloadRequested = false;
  let manualReturn: AuthRefreshReturn | null = null;

  const writeReturn = (record: AuthRefreshReturn) => {
    try {
      const storage = getStorage();
      storage.removeItem(AUTH_REFRESH_STORAGE_KEY);
      const raw = JSON.stringify(record);
      storage.setItem(AUTH_REFRESH_STORAGE_KEY, raw);
      return storage.getItem(AUTH_REFRESH_STORAGE_KEY) === raw;
    } catch {
      return false;
    }
  };

  const requestReload = (): 'reloading' | 'manual' => {
    if (reloadRequested) return 'reloading';
    reloadRequested = true;
    try {
      reload();
      return 'reloading';
    } catch {
      // Navigation/storage failure is not an authentication failure.
      reloadRequested = false;
      busy = false;
      return 'manual';
    }
  };

  return {
    begin() {
      if (busy || reloadRequested) return false;
      busy = true;
      manualReturn = null;
      return true;
    },
    release() {
      if (!reloadRequested) busy = false;
    },
    complete(page: PageId, notice: AuthRefreshNotice | null = null): 'reloading' | 'manual' | 'skipped' {
      if (reloadRequested) return 'reloading';
      if (!busy) return 'skipped';
      if (!isPublicPage(page)) {
        busy = false;
        return 'skipped';
      }
      manualReturn = { version: 1, page, notice, createdAt: now() };
      if (!writeReturn(manualReturn)) {
        busy = false;
        return 'manual';
      }
      return requestReload();
    },
    reloadManually() {
      if (!manualReturn || busy || reloadRequested) return;
      busy = true;
      // Explicit user choice may proceed without storage, after the notice was visible.
      writeReturn({ ...manualReturn, createdAt: now() });
      requestReload();
    },
  };
};
