/**
 * @file admin/login/page.tsx
 * @description Login-Seite mit Rollen-Auswahl für SmartMaintain.
 *
 * Zeigt alle verfügbaren Rollen als auswählbare Karten an:
 * - Verwalter / Mitarbeiter → /admin (voller Zugriff)
 * - Geschäftsführung / IT   → /viewer (read-only)
 *
 * Ablauf:
 * 1. Benutzer wählt seine Rolle (Karte anklicken)
 * 2. Passwortfeld erscheint für die gewählte Rolle
 * 3. login() prüft Passwort → Session + Rolle gespeichert
 * 4. Weiterleitung zur passenden Seite
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, ROLE_LABELS, ROLE_DESCRIPTIONS, type UserRole } from "@/lib/auth";
import {
  LayoutDashboard, Eye, EyeOff, AlertCircle,
  ShieldCheck, LineChart, ChevronRight, ArrowLeft, Database,
} from "lucide-react";

/**
 * Konfiguration der Rollen-Karten auf der Login-Seite.
 * Jede Karte führt nach erfolgreichem Login zur passenden Route.
 */
const ROLE_CARDS: {
  role: UserRole;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  route: string;
}[] = [
  {
    role: "admin",
    icon: <ShieldCheck className="w-6 h-6" />,
    gradient: "from-blue-500 to-blue-700",
    glow: "shadow-blue-500/30",
    route: "/admin",
  },
  {
    role: "it",
    icon: <Database className="w-6 h-6" />,
    gradient: "from-teal-500 to-teal-700",
    glow: "shadow-teal-500/30",
    route: "/admin",
  },
  {
    role: "viewer",
    icon: <LineChart className="w-6 h-6" />,
    gradient: "from-violet-500 to-violet-700",
    glow: "shadow-violet-500/30",
    route: "/viewer",
  },
];

export default function AdminLogin() {
  const router = useRouter();

  /** Aktuell ausgewählte Rolle (null = noch keine ausgewählt) */
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Aktive Karten-Konfiguration */
  const activeCard = ROLE_CARDS.find((c) => c.role === selectedRole);

  /** Rolle auswählen und Passwortfeld einblenden */
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPassword("");
    setError(false);
  };

  /** Zurück zur Rollen-Auswahl */
  const handleBack = () => {
    setSelectedRole(null);
    setPassword("");
    setError(false);
  };

  /** Login-Formular absenden */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    await new Promise((r) => setTimeout(r, 600)); // UX-Feedback

    const role = login(password);
    if (role) {
      // Zur rollenspezifischen Seite weiterleiten
      router.push(activeCard!.route);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Hintergrund-Dekoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* App-Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartMaintain</h1>
          <p className="text-blue-300/70 text-sm mt-1">
            {selectedRole ? "Passwort eingeben" : "Rolle auswählen"}
          </p>
        </div>

        {/* SCHRITT 1: Rollen-Auswahl */}
        {!selectedRole && (
          <div className="space-y-3">
            {ROLE_CARDS.map((card) => (
              <button
                key={card.role}
                onClick={() => handleSelectRole(card.role)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex items-center gap-4 transition-all group text-left"
              >
                {/* Rollen-Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center text-white shadow-lg ${card.glow} shrink-0`}>
                  {card.icon}
                </div>

                {/* Rollen-Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">
                    {ROLE_LABELS[card.role]}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5 leading-snug">
                    {ROLE_DESCRIPTIONS[card.role]}
                  </p>
                </div>

                {/* Pfeil */}
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
              </button>
            ))}

            {/* Hinweis für Mieter */}
            <div className="mt-4 text-center">
              <p className="text-white/30 text-xs">
                Mieter?{" "}
                <a href="/" className="text-blue-400/70 hover:text-blue-400 underline transition-colors">
                  Schadensmeldung einreichen →
                </a>
              </p>
            </div>
          </div>
        )}

        {/* SCHRITT 2: Passwort-Eingabe */}
        {selectedRole && activeCard && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Zurück-Button + Rollen-Anzeige */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="text-white/40 hover:text-white/70 transition-colors"
                aria-label="Zurück zur Rollenauswahl"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={`w-9 h-9 bg-gradient-to-br ${activeCard.gradient} rounded-xl flex items-center justify-center text-white shadow-md ${activeCard.glow}`}>
                {activeCard.icon}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{ROLE_LABELS[selectedRole]}</p>
                <p className="text-white/40 text-xs">Passwort eingeben</p>
              </div>
            </div>

            {/* Passwort-Formular */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Passwort eingeben"
                  autoFocus
                  className={`w-full bg-white/10 border rounded-xl px-4 py-3 pr-10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? "border-red-400/60 focus:ring-red-400/30"
                      : "border-white/10 focus:ring-blue-400/40 focus:border-blue-400/40"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Fehlermeldung */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Falsches Passwort. Bitte erneut versuchen.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className={`w-full bg-gradient-to-r ${activeCard.gradient} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Anmelden…
                  </span>
                ) : (
                  "Anmelden"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
