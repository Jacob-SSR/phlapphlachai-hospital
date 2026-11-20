"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "./api";
import type { Content } from "./content";
export type StaffUser = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: "admin" | "editor";
};
export function useContent() {
  const [rows, setRows] = useState<Content[]>([]),
    [user, setUser] = useState<StaffUser | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [configured, setConfigured] = useState(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const ticket = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const status = await apiFetch("/api/status");
      if (ticket !== generation.current) return;
      setConfigured(status.database);
      if (!status.database) {
        setRows([]);
        setUser(null);
        setError("ยังไม่ได้เชื่อมฐานข้อมูล กำลังแสดงตัวอย่างหน้าบ้าน");
        return;
      }
      let staff = null;
      try {
        staff = await apiFetch("/api/session");
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) throw e;
      }
      const data = await apiFetch("/api/content");
      if (ticket === generation.current) {
        setRows(data.items);
        setUser(staff);
      }
    } catch (e) {
      if (ticket === generation.current) {
        setRows([]);
        setUser(null);
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    } finally {
      if (ticket === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  return {
    rows,
    user,
    role: user?.role ?? null,
    loading,
    error,
    configured,
    reload,
  };
}
