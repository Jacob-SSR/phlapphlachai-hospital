import test from "node:test";
import assert from "node:assert/strict";
import {
  accountIdentity,
  parseLoginIdentifier,
  throttleSubject,
} from "../lib/login-identity.mjs";
test("one login field routes normalized usernames and emails to exact unique lookups", () => {
  assert.deepEqual(parseLoginIdentifier("  Staff.One  "), {
    identifier: "staff.one",
    where: { username: "staff.one" },
  });
  assert.deepEqual(parseLoginIdentifier("  Staff@Hospital.Example  "), {
    identifier: "staff@hospital.example",
    where: { email: "staff@hospital.example" },
  });
});
test("accounts can omit email without inventing an address", () => {
  for (const email of [undefined, null, "", "   "])
    assert.deepEqual(accountIdentity("Staff_01", email), {
      username: "staff_01",
      email: null,
    });
  assert.deepEqual(accountIdentity("Staff_01", " STAFF@hospital.example "), {
    username: "staff_01",
    email: "staff@hospital.example",
  });
});
test("usernames cannot overlap the email login namespace or contain unsafe characters", () => {
  for (const username of [
    "ab",
    "a".repeat(65),
    "staff name",
    "@staff",
    "staff@example.com",
    "staff/one",
    "<admin>",
  ])
    assert.throws(() => accountIdentity(username, ""));
  assert.equal(accountIdentity("abc", "").username, "abc");
  assert.equal(accountIdentity("a".repeat(64), "").username.length, 64);
  assert.throws(() => accountIdentity("staff", "not-an-email"));
});
test("malformed or missing identities fail before querying accounts", () => {
  for (const value of [
    undefined,
    null,
    {},
    [],
    42,
    "",
    "x@",
    "x@@example.com",
    "x@example.",
  ])
    assert.throws(() => parseLoginIdentifier(value));
});
test("switching between email and username cannot bypass the account login limit", () => {
  const account = { id: "same-account" };
  assert.equal(
    throttleSubject(account, "staff"),
    throttleSubject(account, "staff@hospital.example"),
  );
  assert.notEqual(
    throttleSubject({ id: "other-account" }, "staff"),
    throttleSubject(account, "staff"),
  );
  assert.notEqual(
    throttleSubject(null, "missing1"),
    throttleSubject(null, "missing2"),
  );
});
