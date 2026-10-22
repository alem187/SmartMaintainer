"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getRole, hasAdminAccess, isAuthenticated } from "@/lib/auth";

const subscribe = () => () => {};
const serverSnapshot = () => false;
const adminSnapshot = () => isAuthenticated() && hasAdminAccess();
const viewerSnapshot = () => isAuthenticated() && getRole() === "viewer";

/** Existing browser-only demo access. Never use as a security boundary. */
export function useDemoAccess(role: "admin" | "viewer") {
  const router = useRouter();
  const allowed = useSyncExternalStore(
    subscribe,
    role === "admin" ? adminSnapshot : viewerSnapshot,
    serverSnapshot,
  );
  useEffect(() => {
    const check = role === "admin" ? adminSnapshot : viewerSnapshot;
    if (!check()) router.replace("/admin/login");
  }, [role, router]);
  return allowed;
}
