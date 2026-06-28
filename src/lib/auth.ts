/**
 * @file auth.ts
 * @description Rollenbasiertes Authentifizierungs-Modul für SmartMaintain.
 *
 * Rollen-Übersicht:
 * ┌─────────────────────┬──────────────────────────────────────────────────┐
 * │ Rolle               │ Zugang                                           │
 * ├─────────────────────┼──────────────────────────────────────────────────┤
 * │ mieter              │ Nur / (Ticket einreichen) – kein Login nötig     │
 * │ admin               │ Voller Zugriff: /admin + /admin/analytics        │
 * │ (Verwalter)         │ Status ändern, CSV-Export                        │
 * │ it                  │ Voller Zugriff: /admin + /admin/analytics        │
 * │ (IT & Datenschutz)  │ Identisch mit admin-Rolle                        │
 * │ viewer              │ Lesend: /viewer + /viewer/analytics              │
 * │ (Geschäftsführung)  │ Kein Status-Ändern                               │
 * └─────────────────────┴──────────────────────────────────────────────────┘
 */

const SESSION_KEY = "sm_admin_session";
const ROLE_KEY    = "sm_admin_role";

/** Verfügbare Rollen im System */
export type UserRole = "admin" | "it" | "viewer";

/**
 * Anmeldedaten pro Rolle.
 * In Produktion: aus Convex Environment Variables lesen.
 */
const CREDENTIALS: Record<string, UserRole> = {
  admin2026:  "admin",   // Verwalter / Mitarbeiter – voller Zugriff
  it2026:     "it",      // IT & Datenschutz – voller Zugriff
  viewer2026: "viewer",  // Geschäftsführung – read-only
};

/** Anzeigenamen pro Rolle (für Login-Karten und Header) */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin:  "Verwalter / Mitarbeiter",
  it:     "IT & Datenschutz",
  viewer: "Geschäftsführung",
};

/** Kurzbeschreibungen pro Rolle für die Login-Seite */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin:  "Voller Zugriff: Tickets verwalten, Status ändern, Analytics",
  it:     "Voller Zugriff: Systemverwaltung, Tickets, Analytics, Datenschutz",
  viewer: "Lesezugriff: Tickets & Analytics einsehen, CSV-Export",
};

/**
 * Versucht den Benutzer anzumelden.
 * @returns Die zugewiesene Rolle bei Erfolg, `null` bei falschem Passwort
 */
export function login(password: string): UserRole | null {
  const role = CREDENTIALS[password];
  if (role) {
    sessionStorage.setItem(SESSION_KEY, "authenticated");
    sessionStorage.setItem(ROLE_KEY, role);
    return role;
  }
  return null;
}

/** Meldet den aktuellen Benutzer ab */
export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

/** Prüft ob der Benutzer eingeloggt ist */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "authenticated";
}

/** Gibt die Rolle des aktuell eingeloggten Benutzers zurück */
export function getRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = sessionStorage.getItem(ROLE_KEY);
  if (role === "admin" || role === "it" || role === "viewer") return role;
  return null;
}

/**
 * Prüft ob der Benutzer vollen Admin-Zugriff hat.
 * Gilt für: "admin" (Verwalter) UND "it" (IT & Datenschutz)
 */
export function hasAdminAccess(): boolean {
  const role = getRole();
  return role === "admin" || role === "it";
}

/**
 * Gibt die Ziel-Route nach erfolgreichem Login zurück.
 * - admin / it → /admin (voller Zugriff)
 * - viewer     → /viewer (read-only)
 */
export function getLoginRedirect(role: UserRole): string {
  if (role === "admin" || role === "it") return "/admin";
  return "/viewer";
}
