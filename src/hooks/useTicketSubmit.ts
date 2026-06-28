"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

type SubmitStatus = "idle" | "sending" | "success";

export function useTicketSubmit() {
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const fileInput = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createTicket = useMutation(api.tickets.create);

  const handleFileChange = useCallback(() => {
    const file = fileInput.current?.files?.[0];
    setFileName(file ? file.name : null);
  }, []);

  const reset = useCallback(() => {
    setDescription("");
    setFileName(null);
    setStatus("idle");
    if (fileInput.current) fileInput.current.value = "";
  }, []);

  const clearFile = useCallback(() => {
    setFileName(null);
    if (fileInput.current) fileInput.current.value = "";
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim()) return;

      setStatus("sending");

      try {
        let storageId = undefined;
        const file = fileInput.current?.files?.[0];

        if (file) {
          const postUrl = await generateUploadUrl();
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const json = await result.json();
          storageId = json.storageId;
        }

        await createTicket({ description: description.trim(), storageId });
        setStatus("success");
        setDescription("");
        setFileName(null);
        if (fileInput.current) fileInput.current.value = "";
      } catch (error) {
        console.error("Fehler beim Senden:", error);
        alert("Fehler beim Senden. Bitte versuchen Sie es erneut.");
        setStatus("idle");
      }
    },
    [description, generateUploadUrl, createTicket]
  );

  return {
    description,
    setDescription,
    fileName,
    status,
    fileInput,
    handleFileChange,
    submit,
    reset,
    clearFile,
  };
}
