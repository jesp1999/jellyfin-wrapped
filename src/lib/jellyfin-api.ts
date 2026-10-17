import { Api, Jellyfin } from "@jellyfin/sdk";

import {
  getCacheValue,
  JELLYFIN_AUTH_TOKEN_CACHE_KEY,
  JELLYFIN_PASSWORD_CACHE_KEY,
  JELLYFIN_SERVER_URL_CACHE_KEY,
  JELLYFIN_USERNAME_CACHE_KEY,
  removeCacheValue,
  setCacheValue,
} from "./cache";

let api: Api | null = null;
let adminApi: Api | null = null;
const sleep = (durationMs: number) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

// One id per browser. A shared id makes Jellyfin treat every device as the same one, so a sign-in on a second device can invalidate the first one's token.
const deviceId = (): string => {
  const key = "jellyfinwrapped_device_id";
  try { let id = localStorage.getItem(key); if (!id) { id = globalThis.crypto?.randomUUID?.() ?? `wrapped-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(key, id); } return id; } catch { return "Jellyfin-Wrapped"; }
};

// Get environment variables
export const getEnvVar = (name: string): string | undefined => {
  // Check if we're in a browser environment with window.ENV (production/Docker)
  if (typeof window !== "undefined" && "ENV" in window) {
    const env = (window as { ENV?: Record<string, string> }).ENV;
    return env?.[name];
  }
  // Fallback to import.meta.env for Vite (development)
  return import.meta.env[`VITE_${name}`] as string | undefined;
};

const getServerUrl = (): string => {
  const envServerUrl = getEnvVar("JELLYFIN_SERVER_URL");
  if (envServerUrl) {
    return envServerUrl;
  }

  const cachedServerUrl = getCacheValue(JELLYFIN_SERVER_URL_CACHE_KEY);
  if (!cachedServerUrl) {
    throw new Error("JELLYFIN_SERVER_URL environment variable is required");
  }

  return cachedServerUrl;
};

const getAdminApiKey = (): string => {
  const adminApiKey = getEnvVar("JELLYFIN_API_KEY");
  if (!adminApiKey) {
    throw new Error("JELLYFIN_API_KEY environment variable is required");
  }
  return adminApiKey;
};

export const getAdminJellyfinApi = (): Api => {
  const serverUrl = getServerUrl();
  const apiKey = getAdminApiKey();

  adminApi = authenticateByAuthToken(serverUrl, apiKey);
  return adminApi;
};
export const getAuthenticatedJellyfinApi = async (): Promise<Api> => {
  if (api && api.accessToken) {
    return api;
  }

  const serverUrl = getServerUrl();
  const username = getCacheValue(JELLYFIN_USERNAME_CACHE_KEY) ?? "";
  const password = getCacheValue(JELLYFIN_PASSWORD_CACHE_KEY) ?? "";
  const jellyfinAuthToken = getCacheValue(JELLYFIN_AUTH_TOKEN_CACHE_KEY);

  if (!username && !jellyfinAuthToken) {
    throw new Error(
      "Missing credentials in localStorage. Please configure your Jellyfin connection."
    );
  }

  // Attempt to authenticate with stored credentials
  if (jellyfinAuthToken) {
    api = authenticateByAuthToken(serverUrl, jellyfinAuthToken);
  } else {
    api = await authenticateByUserName(serverUrl, username, password);
    // No, I cannot explain why this needs to happen twice with long delay.
    // However, if omitted, you cannot refresh the page from a specific route.
    await sleep(1000);
    api = await authenticateByUserName(serverUrl, username, password);
  }
  return api;
};

export const authenticateByAuthToken = (
  serverUrl: string,
  jellyfinApiKey: string
): Api => {
  const jellyfin = new Jellyfin({
    clientInfo: {
      name: "Jellyfin-Wrapped",
      version: "1.0.0",
    },
    deviceInfo: {
      name: "Jellyfin-Wrapped",
      id: deviceId(),
    },
  });
  api = jellyfin.createApi(serverUrl, jellyfinApiKey);
  return api;
};

export const authenticateByUserName = async (
  serverUrl: string,
  username: string,
  password: string
): Promise<Api> => {
  if (api?.accessToken) {
    return api;
  }
  const jellyfin = new Jellyfin({
    clientInfo: {
      name: "Jellyfin-Wrapped",
      version: "1.0.0",
    },
    deviceInfo: {
      name: "Jellyfin-Wrapped",
      id: deviceId(),
    },
  });
  console.log("Connecting to server...", { serverUrl, username });
  const client = jellyfin.createApi(serverUrl);
  try {
    await client.authenticateUserByName(username, password);
  } catch (error) {
    console.error("Connection failed:", error);
    const s = (error as { response?: { status?: number } }).response?.status;
    throw new Error(s === 401 ? "Incorrect username or password." : s ? "The server rejected the sign-in." : "Could not reach the server. Check the URL.");
  }
  // Keep the session token, not the password.
  if (client.accessToken) setCacheValue(JELLYFIN_AUTH_TOKEN_CACHE_KEY, client.accessToken);
  removeCacheValue(JELLYFIN_PASSWORD_CACHE_KEY);
  api = client;
  return client;
};
