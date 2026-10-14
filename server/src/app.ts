import http from "node:http";
import type { Config } from "./config.js";
import { JellyfinClient, UpstreamError } from "./jellyfin.js";
import { UserDbCache } from "./cache.js";
import {
  DatabaseClosedError,
  QueryError,
  QueryTimeoutError,
  UserDb,
} from "./userdb.js";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_QUERY_CHARS = 20000;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, "Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function bearerToken(req: http.IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (typeof header !== "string") return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match?.[1] ?? null;
}

function parseQuery(body: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
  const query = (parsed as { query?: unknown } | null)?.query;
  if (
    typeof query !== "string" ||
    query.trim() === "" ||
    query.length > MAX_QUERY_CHARS
  ) {
    throw new HttpError(400, 'Body must be {"query": "<SQL>"}');
  }
  return query;
}

export interface App {
  server: http.Server;
  close(): Promise<void>;
}

export function createApp({
  config,
  jellyfin,
}: {
  config: Config;
  jellyfin: JellyfinClient;
}): App {
  const cache = new UserDbCache(
    async (userId) =>
      UserDb.create(
        await jellyfin.fetchUserActivity(userId),
        config.maxResultRows
      ),
    config.cacheTtlMs,
    config.maxCachedUsers
  );

  async function handlePlaybackReport(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const token = bearerToken(req);
    if (!token) throw new HttpError(401, "Authentication required");

    const user = await jellyfin.verifyToken(token);
    if (!user) throw new HttpError(401, "Invalid or expired session");

    const query = parseQuery(await readBody(req));
    // The data comes from the verified user id, never from anything the client sent.
    const db = await cache.get(user.id);
    const result = await db.query(query, config.queryTimeoutMs);
    // Same shape (including the "colums" spelling) the playback reporting plugin returns.
    sendJson(res, 200, { colums: result.columns, results: result.rows });
  }

  const server = http.createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;

    const run = async (): Promise<void> => {
      if (path === "/api/health") {
        if (req.method !== "GET")
          throw new HttpError(405, "Method not allowed");
        sendJson(res, 200, { status: "ok" });
        return;
      }
      if (path === "/api/playback-report") {
        if (req.method !== "POST")
          throw new HttpError(405, "Method not allowed");
        await handlePlaybackReport(req, res);
        return;
      }
      throw new HttpError(404, "Not found");
    };

    run().catch((error: unknown) => {
      if (res.headersSent) return;
      if (error instanceof HttpError)
        return sendJson(res, error.status, { error: error.message });
      if (error instanceof QueryTimeoutError)
        return sendJson(res, 504, { error: error.message });
      if (error instanceof QueryError)
        return sendJson(res, 400, { error: error.message });
      if (error instanceof DatabaseClosedError)
        return sendJson(res, 503, { error: error.message });
      if (error instanceof UpstreamError)
        return sendJson(res, error.status, { error: error.message });
      console.error("[server] Unexpected error:", error);
      sendJson(res, 500, { error: "Internal error" });
    });
  });

  return {
    server,
    close: () =>
      new Promise<void>((resolve) => {
        cache.closeAll();
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  };
}
