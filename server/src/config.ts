export interface Config {
  /** Address the server uses to reach Jellyfin (can differ from the address browsers use). */
  jellyfinUrl: string;
  /** Admin API key. Only ever sent to Jellyfin, never to browsers. */
  apiKey: string;
  port: number;
  /** How long a user's playback data copy is reused before it is fetched again. */
  cacheTtlMs: number;
  /** Maximum number of users whose data is held in memory at once. */
  maxCachedUsers: number;
  /** Per-query time limit. A query that exceeds it is stopped. */
  queryTimeoutMs: number;
  /** Maximum number of rows a single query may return. */
  maxResultRows: number;
}

function intFromEnv(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const jellyfinUrl = env.JELLYFIN_SERVER_URL?.replace(/\/+$/, "");
  const apiKey = env.JELLYFIN_API_KEY;
  if (!jellyfinUrl || !apiKey) {
    throw new Error("JELLYFIN_SERVER_URL and JELLYFIN_API_KEY must be set");
  }

  return {
    jellyfinUrl,
    apiKey,
    port: intFromEnv(env, "PORT", 3000, 1, 65535),
    cacheTtlMs: intFromEnv(env, "CACHE_TTL_SECONDS", 300, 1, 86400) * 1000,
    maxCachedUsers: intFromEnv(env, "MAX_CACHED_USERS", 50, 1, 1000),
    queryTimeoutMs: intFromEnv(env, "QUERY_TIMEOUT_MS", 5000, 100, 60000),
    maxResultRows: intFromEnv(env, "MAX_RESULT_ROWS", 200000, 1, 5000000),
  };
}
