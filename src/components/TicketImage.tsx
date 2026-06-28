"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Image as ImageIcon } from "lucide-react";

export function TicketImage({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.storage.getUrl, { storageId });

  if (!url) {
    return (
      <div className="mt-3 w-full h-28 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
        <ImageIcon className="w-5 h-5 text-gray-300 animate-pulse" />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 group/img"
    >
      <div className="relative overflow-hidden rounded-xl border border-gray-100">
        <img
          src={url}
          alt="Anhang"
          className="w-full h-32 object-cover group-hover/img:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}
