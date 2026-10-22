"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The public demo never mounts a Convex provider or subscribes to real data.
  if (pathname === "/demo") return children;
  if (!convex)
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-slate-700">
        <h1 className="mb-4 text-2xl font-bold">
          SmartMaintain lokal einrichten
        </h1>
        <p className="mb-6">
          Für den Echtzeitbetrieb fehlt NEXT_PUBLIC_CONVEX_URL. Die Anleitung
          steht in der README. Du kannst die Auswertung ohne Backend
          ausprobieren.
        </p>
        <Link
          className="inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          href="/demo"
        >
          Interaktive Demo öffnen
        </Link>
      </main>
    );
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
