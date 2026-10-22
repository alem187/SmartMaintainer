"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { AnalyticsReport } from "@/components/AnalyticsReport";
import { Spinner } from "@/components/ui/Spinner";
import type { Ticket } from "@/lib/types";

// This preserves the existing demo-only UI guard. It is not backend authorization.
export default function AnalyticsPage() {
  const authChecked = useDemoAccess("viewer");
  // Do not subscribe before the existing UI guard has completed.
  const tickets = useQuery(api.tickets.list, authChecked ? {} : "skip") as
    Ticket[] | undefined;
  if (!authChecked) return null;
  if (!tickets)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="size-8 text-blue-600" />
      </div>
    );
  return (
    <AnalyticsReport
      tickets={tickets}
      backHref="/viewer"
      roleLabel="Nur lesen"
    />
  );
}
