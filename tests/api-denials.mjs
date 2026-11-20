import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3100";
const checks = [
  ["GET", "/api/session", 401, {}],
  ["POST", "/api/content", 401, { Origin: base }],
  [
    "PATCH",
    "/api/content/00000000-0000-4000-8000-000000000000",
    401,
    { Origin: base },
  ],
  [
    "DELETE",
    "/api/content/00000000-0000-4000-8000-000000000000",
    401,
    { Origin: base },
  ],
  ["POST", "/api/uploads/image", 401, { Origin: base }],
  ["POST", "/api/uploads/pdf", 401, { Origin: base }],
  ["POST", "/api/content", 403, { Origin: "https://untrusted.example" }],
  ["POST", "/api/auth/logout", 403, { Origin: "https://untrusted.example" }],
  ["POST", "/api/content", 403, {}],
  ["GET", "/api/session", 401, { Cookie: "hospital_session=forged.jwt.token" }],
  ["GET", "/api/content/not-a-uuid/download", 404, {}],
];
for (const [method, path, status, headers] of checks) {
  const response = await fetch(base + path, { method, headers });
  assert.equal(response.status, status, `${method} ${path}`);
  const body = await response.text();
  assert.ok(
    !/postgres(ql)?:\/\/|passwordHash|JWT_SECRET=/.test(body),
    "No secrets in error response",
  );
}
console.log(`${checks.length} API authorization/origin checks passed`);
