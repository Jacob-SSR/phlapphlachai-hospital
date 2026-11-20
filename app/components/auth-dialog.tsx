"use client";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
export default function AuthDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setError("");
      setPassword("");
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [open]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setPassword("");
      await onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
      aria-labelledby="login-title"
    >
      <div className="modal-head">
        <span className="service-icon">
          <LockKeyhole />
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
        >
          <X />
        </button>
      </div>
      <h2 id="login-title">เข้าสู่ระบบเจ้าหน้าที่</h2>
      <p className="form-intro">สำหรับเจ้าหน้าที่ที่ได้รับสิทธิ์จัดการข้อมูลโรงพยาบาล</p>
      <form onSubmit={submit} className="staff-form">
        <label>
          ชื่อผู้ใช้หรืออีเมล
          <input
            type="text"
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            maxLength={191}
            disabled={busy}
          />
        </label>
        <label>
          รหัสผ่าน
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={256}
            disabled={busy}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
    </dialog>
  );
}
