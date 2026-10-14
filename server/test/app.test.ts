import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createApp, type App } from "../src/app.js";
import type { Config } from "../src/config.js";
import { JellyfinClient } from "../src/jellyfin.js";

const ADMIN_KEY = "admin-key-that-must-stay-on-the-server";
const ALICE = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const BOB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TOKENS: Record<string, { id: string; name: string }> = {
  "token-alice": { id: ALICE, name: "alice" },
  "token-bob": { id: BOB, name: "bob" },
};

const COLUMNS = [
  "DateCreated",
  "UserId",
  "ItemId",
  "ItemType",
  "ItemName",
  "PlaybackMethod",
  "ClientName",
  "DeviceName",
  "PlayDuration",
];
const SCHEMA = [
  ["DateCreated", "DATETIME"],
  ["UserId", "TEXT"],
  ["ItemId", "TEXT"],
  ["ItemType", "TEXT"],
  ["ItemName", "TEXT"],
  ["PlaybackMethod", "TEXT"],
  ["ClientName", "TEXT"],
  ["DeviceName", "TEXT"],
  ["PlayDuration", "INT"],
];

// [rowid, ...columns]
const TABLE: string[][] = [
  [
    "1",
    "2025-01-10 20:00:00",
    ALICE,
    "m1",
    "Movie",
    "Movie One",
    "DirectPlay",
    "web",
    "tv",
    "7200",
  ],
  [
    "2",
    "2025-02-11 20:00:00",
    BOB,
    "m2",
    "Movie",
    "Movie Two",
    "DirectPlay",
    "web",
    "tv",
    "5400",
  ],
  [
    "3",
    "2025-03-12 20:00:00",
    ALICE,
    "e1",
    "Episode",
    "Show - s01e01",
    "DirectPlay",
    "web",
    "tv",
    "1500",
  ],
  [
    "4",
    "2025-04-13 20:00:00",
    ALICE,
    "a1",
    "Audio",
    "Song One",
    "DirectPlay",
    "app",
    "phone",
    "90",
  ],
  [
    "5",
    "2025-05-14 20:00:00",
    BOB,
    "a2",
    "Audio",
    "Song Two",
    "DirectPlay",
    "app",
    "phone",
    "200",
  ],
];

interface Call {
  path: string;
  token: string | undefined;
  query?: string;
}

function startFakeJellyfin(calls: Call[]): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    const token = req.headers["x-emby-token"];
    const tokenValue = typeof token === "string" ? token : undefined;
    const path = req.url ?? "";
    const json = (status: number, body: unknown): void => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (path === "/Users/Me") {
      calls.push({ path, token: tokenValue });
      const user = tokenValue ? TOKENS[tokenValue] : undefined;
      if (!user) return json(401, {});
      return json(200, {
        Id: user.id,
        Name: user.name,
        Policy: { IsDisabled: false },
      });
    }

    if (
      path === "/user_usage_stats/submit_custom_query" &&
      req.method === "POST"
    ) {
      let raw = "";
      req.on("data", (c: Buffer) => (raw += c.toString()));
      req.on("end", () => {
        const query = (JSON.parse(raw) as { CustomQueryString: string })
          .CustomQueryString;
        calls.push({ path, token: tokenValue, query });
        if (tokenValue !== ADMIN_KEY) return json(401, {});

        if (query.includes("pragma_table_info")) {
          return json(200, { colums: ["name", "type"], results: SCHEMA });
        }
        const match = /WHERE UserId = '([0-9a-f]+)'/.exec(query);
        if (match) {
          const rows = TABLE.filter((r) => r[2] === match[1]).map((r) => [
            r[0] as string,
            ...r.slice(1),
          ]);
          // The fake keeps the real table's column order: rowid first, then the table columns.
          const ordered = rows.map((r) => [r[0] as string, ...r.slice(1)]);
          return json(200, {
            colums: ["__rowid", ...COLUMNS],
            results: ordered,
          });
        }
        return json(400, {});
      });
      return;
    }
    json(404, {});
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve(server))
  );
}

// The table above stores columns as [rowid, DateCreated, UserId, ...]; keep it in step with COLUMNS.
assert.equal((TABLE[0] as string[]).length, COLUMNS.length + 1);

describe("playback report proxy", () => {
  const calls: Call[] = [];
  let fake: http.Server;
  let app: App;
  let base: string;

  before(async () => {
    fake = await startFakeJellyfin(calls);
    const jellyfinUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
    const config: Config = {
      jellyfinUrl,
      apiKey: ADMIN_KEY,
      port: 0,
      cacheTtlMs: 60000,
      maxCachedUsers: 5,
      queryTimeoutMs: 500,
      maxResultRows: 100,
    };
    app = createApp({ config, jellyfin: new JellyfinClient(config) });
    await new Promise<void>((resolve) =>
      app.server.listen(0, "127.0.0.1", resolve)
    );
    base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await app.close();
    fake.closeAllConnections();
    await new Promise<void>((resolve) => fake.close(() => resolve()));
  });

  async function query(
    sql: string,
    token: string | null = "token-alice"
  ): Promise<{
    status: number;
    body: { colums?: string[]; results?: string[][]; error?: string };
  }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${base}/api/playback-report`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: sql }),
    });
    return {
      status: res.status,
      body: (await res.json()) as {
        colums?: string[];
        results?: string[][];
        error?: string;
      },
    };
  }

  it("answers the health check", async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
  });

  it("rejects requests without a valid token", async () => {
    assert.equal((await query("SELECT 1", null)).status, 401);
    assert.equal((await query("SELECT 1", "not-a-token")).status, 401);
  });

  it("only returns the logged-in user's rows", async () => {
    const alice = await query("SELECT COUNT(*) FROM PlaybackActivity");
    assert.deepEqual(alice.body.results, [["3"]]);
    const bob = await query(
      "SELECT COUNT(*) FROM PlaybackActivity",
      "token-bob"
    );
    assert.deepEqual(bob.body.results, [["2"]]);
  });

  it("cannot reach another user's rows by asking for them", async () => {
    const res = await query(
      `SELECT * FROM PlaybackActivity WHERE UserId = '${BOB}'`
    );
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.results, []);
  });

  it("fetches each user's data once and reuses it", async () => {
    const before = calls.filter((c) =>
      c.query?.includes("WHERE UserId")
    ).length;
    await query("SELECT 1");
    await query("SELECT 2");
    const after = calls.filter((c) => c.query?.includes("WHERE UserId")).length;
    assert.equal(after, before);
  });

  it("returns the plugin's response shape, with text values", async () => {
    const res = await query(
      "SELECT ItemName, PlayDuration FROM PlaybackActivity WHERE ItemType = 'Movie'"
    );
    assert.deepEqual(res.body.colums, ["ItemName", "PlayDuration"]);
    assert.deepEqual(res.body.results, [["Movie One", "7200"]]);
  });

  it("compares numbers as numbers", async () => {
    const res = await query(
      "SELECT COUNT(*) FROM PlaybackActivity WHERE PlayDuration > 100"
    );
    assert.deepEqual(res.body.results, [["2"]]);
  });

  it("keeps the plugin's rowid", async () => {
    const res = await query(
      "SELECT ROWID, * FROM PlaybackActivity ORDER BY rowid DESC"
    );
    assert.equal((res.body.results?.[0] as string[])[0], "4");
    assert.equal(res.body.results?.length, 3);
  });

  it("accepts WITH queries", async () => {
    const res = await query(
      "WITH x AS (SELECT * FROM PlaybackActivity) SELECT COUNT(*) FROM x"
    );
    assert.deepEqual(res.body.results, [["3"]]);
  });

  it("refuses anything that is not a single SELECT", async () => {
    const attempts = [
      "DELETE FROM PlaybackActivity",
      "DROP TABLE PlaybackActivity",
      "UPDATE PlaybackActivity SET PlayDuration = 0",
      "ATTACH DATABASE '/tmp/x.db' AS x",
      "PRAGMA query_only = OFF",
      "SELECT 1; DELETE FROM PlaybackActivity",
      "/* hi */ DELETE FROM PlaybackActivity",
      "WITH x AS (SELECT 1) DELETE FROM PlaybackActivity",
    ];
    for (const sql of attempts) {
      const res = await query(sql);
      assert.equal(res.status, 400, `accepted: ${sql}`);
    }
    const count = await query("SELECT COUNT(*) FROM PlaybackActivity");
    assert.deepEqual(count.body.results, [["3"]]);
  });

  it("reports SQL errors as 400", async () => {
    assert.equal((await query("SELECT * FROM nonexistent")).status, 400);
  });

  it("limits result size", async () => {
    const res = await query(
      "WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c WHERE x < 1000) SELECT x FROM c"
    );
    assert.equal(res.status, 400);
    assert.match(res.body.error ?? "", /larger than/);
  });

  it("stops a runaway query and keeps working afterwards", async () => {
    const started = Date.now();
    const slow = await query(
      "WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c WHERE x < 2000000000) SELECT COUNT(*) FROM c"
    );
    assert.equal(slow.status, 504);
    assert.ok(Date.now() - started < 5000);
    const next = await query("SELECT COUNT(*) FROM PlaybackActivity");
    assert.equal(next.status, 200);
    assert.deepEqual(next.body.results, [["3"]]);
  });

  it("validates the request body", async () => {
    const res = await fetch(`${base}/api/playback-report`, {
      method: "POST",
      headers: {
        Authorization: "Bearer token-alice",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    assert.equal(res.status, 400);
  });

  it("keeps the admin key away from users and user tokens away from the plugin", async () => {
    for (const call of calls) {
      if (call.path === "/Users/Me") assert.notEqual(call.token, ADMIN_KEY);
      else assert.equal(call.token, ADMIN_KEY);
    }
    const res = await fetch(`${base}/api/health`);
    assert.ok(!JSON.stringify([...res.headers.entries()]).includes(ADMIN_KEY));
  });
});
