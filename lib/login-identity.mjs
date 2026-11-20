const USERNAME = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function parseLoginIdentifier(value) {
  if (typeof value !== "string") throw new Error("กรุณากรอกชื่อผู้ใช้หรืออีเมล");
  const identifier = value.trim().toLowerCase();
  if (identifier.includes("@")) {
    if (identifier.length > 191 || !EMAIL.test(identifier))
      throw new Error("อีเมลไม่ถูกต้อง");
    return { identifier, where: { email: identifier } };
  }
  if (!USERNAME.test(identifier))
    throw new Error(
      "ชื่อผู้ใช้ต้องยาว 3–64 ตัว ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง",
    );
  return { identifier, where: { username: identifier } };
}
export function accountIdentity(username, email) {
  const parsed = parseLoginIdentifier(username);
  if (!("username" in parsed.where)) throw new Error("ชื่อผู้ใช้ต้องไม่มี @");
  let normalizedEmail = null;
  if (email !== undefined && email !== null && email !== "") {
    if (typeof email !== "string") throw new Error("อีเมลไม่ถูกต้อง");
    const value = email.trim();
    if (value) {
      const parsedEmail = parseLoginIdentifier(value);
      if (!("email" in parsedEmail.where)) throw new Error("อีเมลไม่ถูกต้อง");
      normalizedEmail = parsedEmail.identifier;
    }
  }
  return { username: parsed.identifier, email: normalizedEmail };
}
// Both aliases share one account-wide limit; switching login names must not reset it.
export function throttleSubject(user, identifier) {
  return user ? `user:${user.id}` : `unknown:${identifier}`;
}
