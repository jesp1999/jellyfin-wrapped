export const JELLYFIN_SERVER_URL_CACHE_KEY = "jellyfinServerUrl";
export const JELLYFIN_AUTH_TOKEN_CACHE_KEY = "jellyfinAuthToken";
export const JELLYFIN_USERNAME_CACHE_KEY = "jellyfinUsername";
export const JELLYFIN_PASSWORD_CACHE_KEY = "jellyfinPassword";
export const JELLYFIN_CURRENT_USER_CACHE_KEY = "jellyfinwrapped_current_user";
export const JELLYFIN_HIDDEN_ITEMS = "jellyfinwrapped_hidden_items";
export const JELLYFIN_REMEMBER_KEY = "jellyfinRemember";
// Sign-in details (server URL, username, session token) live in localStorage only when "Remember me"
// is on. Otherwise they live in sessionStorage and are gone when the tab closes. The password is never stored.
const CREDENTIAL_KEYS = [
  JELLYFIN_SERVER_URL_CACHE_KEY,
  JELLYFIN_AUTH_TOKEN_CACHE_KEY,
  JELLYFIN_USERNAME_CACHE_KEY,
  JELLYFIN_PASSWORD_CACHE_KEY,
];
export const isRemembered = (): boolean => {
  try {
    return localStorage.getItem(JELLYFIN_REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
};
const storeFor = (key: string): Storage => (CREDENTIAL_KEYS.includes(key) && !isRemembered() ? sessionStorage : localStorage);
// Turning it on moves what is in this tab's session into localStorage; turning it off moves it back
// and wipes the saved copy.
export const setRemember = (on: boolean): void => {
  try {
    const from = on ? sessionStorage : localStorage;
    const to = on ? localStorage : sessionStorage;
    if (on) localStorage.setItem(JELLYFIN_REMEMBER_KEY, "1");
    else localStorage.removeItem(JELLYFIN_REMEMBER_KEY);
    for (const key of CREDENTIAL_KEYS) {
      const v = from.getItem(key);
      if (v) to.setItem(key, v);
      from.removeItem(key);
    }
  } catch (error) {
    console.warn("Error changing Remember me:", error);
  }
};
const localCache: Record<string, string> = {};
export const setCacheValue = (key: string, value: string) => {
  try {
    localCache[key] = value;
    storeFor(key).setItem(key, value);
    if (key === JELLYFIN_SERVER_URL_CACHE_KEY || 
        key === JELLYFIN_AUTH_TOKEN_CACHE_KEY || 
        key === JELLYFIN_USERNAME_CACHE_KEY || 
        key === JELLYFIN_PASSWORD_CACHE_KEY) {
      localStorage.removeItem(JELLYFIN_CURRENT_USER_CACHE_KEY);
    }
  } catch (error) {
    console.warn(`Error setting cache value for key ${key}:`, error);
  }
};

export const removeCacheValue = (key: string) => {
  delete localCache[key];
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing cache value for key ${key}:`, error);
  }
};

export const getCacheValue = (key: string): string | null => {
  // Check if the value is in the local cache
  if (localCache[key]) {
    return localCache[key];
  }

  let value: string | null = null;
  try {
    value = storeFor(key).getItem(key) ?? localStorage.getItem(key);
  } catch {
    value = null;
  }
  if (value) {
    localCache[key] = value;
    return value;
  }

  return null;
};

export const getCachedHiddenIds = (): string[] => {
  return getCacheValue(JELLYFIN_HIDDEN_ITEMS)?.split(",") ?? [];
};

export const setCachedHiddenId = (id: string) => {
  const hiddenIds = getCachedHiddenIds();
  hiddenIds.push(id);
  setCacheValue(JELLYFIN_HIDDEN_ITEMS, hiddenIds.join(","));
};
