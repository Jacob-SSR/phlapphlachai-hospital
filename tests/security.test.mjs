import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import {originAllowed} from '../lib/security.mjs';
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  sessionCookie,
  readCookie,
  contentVisible,
} from "../lib/auth-core.mjs";
import {
  validateContent,
  validatePdf,
  detectImage,
} from "../lib/validation.mjs";
const secret =
  "test-only-random-looking-secret-with-64-characters-xxxxxxxxxxxxxxxx";
test('Origin follows the browser host or configured proxy origin, never an unrelated site',()=>{
 assert.equal(originAllowed('http://127.0.0.1:3100','127.0.0.1:3100'),true);
 assert.equal(originAllowed('https://evil.example','hospital.example'),false);
 assert.equal(originAllowed(null,'hospital.example'),false);
 assert.equal(originAllowed('null','hospital.example'),false);
 assert.equal(originAllowed('https://hospital.example','internal:3000','https://hospital.example'),true);
 assert.equal(originAllowed('http://hospital.example','internal:3000','https://hospital.example'),false);
});
test("password hashes are salted, verify only correct passwords, and handle unknown users", async () => {
  const password = "Staff password 123!";
  const a = await hashPassword(password),
    b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.ok(await verifyPassword(password, a));
  assert.equal(await verifyPassword("wrong password", a), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, "broken"), false);
  await assert.rejects(hashPassword("short"));
});
test("JWT rejects a different secret, modified payload, expiry and wrong audience", async () => {
  const user = randomUUID(),
    session = randomUUID(),
    token = await signSession(user, session, secret);
  const payload = await verifySession(token, secret);
  assert.equal(payload.sub, user);
  assert.equal(payload.jti, session);
  await assert.rejects(verifySession(token, secret + "x"));
  const parts = token.split(".");
  parts[1] = Buffer.from(
    JSON.stringify({ ...payload, sub: randomUUID() }),
  ).toString("base64url");
  await assert.rejects(verifySession(parts.join("."), secret));
  for (const [aud, expiry] of [
    ["hospital-staff", 1],
    ["another-site", Math.floor(Date.now() / 1000) + 100],
  ]) {
    const bad = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user)
      .setJti(session)
      .setIssuer("phlapphlachai-hospital")
      .setAudience(aud)
      .setExpirationTime(expiry)
      .sign(new TextEncoder().encode(secret));
    await assert.rejects(verifySession(bad, secret));
  }
  await assert.rejects(signSession(user, session, "short"));
});
test("session cookie is HttpOnly, SameSite and secure in production; logout expires it", () => {
  const cookie = sessionCookie("abc", true);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /; Secure/);
  assert.equal(readCookie("other=a; " + cookie), "abc");
  assert.match(sessionCookie("", true), /Max-Age=0/);
});
test("drafts and deleted records never become public downloads", () => {
  assert.equal(
    contentVisible({ deletedAt: null, published: false }, false),
    false,
  );
  assert.equal(
    contentVisible({ deletedAt: null, published: false }, true),
    true,
  );
  assert.equal(
    contentVisible({ deletedAt: new Date(), published: true }, true),
    false,
  );
  assert.equal(
    contentVisible({ deletedAt: null, published: true }, false),
    true,
  );
});
test("content blocks executable links and malformed publish status", () => {
  const base = {
    kind: "link",
    title: "โรงพยาบาล",
    body: "",
    category: "สำหรับประชาชน",
    published: false,
  };
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "http://example.com",
    "https://user:pass@example.com",
  ])
    assert.throws(() => validateContent({ ...base, external_url: url }));
  assert.equal(
    validateContent({ ...base, external_url: "https://example.com" })
      .external_url,
    "https://example.com/",
  );
  assert.throws(() =>
    validateContent({
      ...base,
      external_url: "https://example.com",
      published: "false",
    }),
  );
  assert.throws(() => validateContent({ ...base, title: " " }));
  assert.throws(() =>
    validateContent({ ...base, kind: "ita", fiscal_year: 1 }),
  );
});
test("file validation rejects disguised HTML/SVG and non-PDF uploads", async () => {
  assert.equal(
    detectImage(new TextEncoder().encode('<svg onload="alert(1)">')),
    null,
  );
  assert.equal(
    detectImage(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  await assert.rejects(
    validatePdf(new File(["<html>"], "fake.pdf", { type: "application/pdf" })),
  );
  await assert.rejects(
    validatePdf(new File(["%PDF-1.7"], "fake.txt", { type: "text/plain" })),
  );
  await validatePdf(
    new File(["%PDF-1.7\n%%EOF"], "document.pdf", { type: "application/pdf" }),
  );
});
