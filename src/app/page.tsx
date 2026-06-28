"use client";

import { Upload, CheckCircle, Camera, Send, ImagePlus, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { useTicketSubmit } from "@/hooks/useTicketSubmit";

function SuccessView({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-emerald-50 via-white to-white text-center">
      <div className="animate-scale-in bg-white rounded-3xl shadow-xl shadow-emerald-100/50 p-10 max-w-sm w-full border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Meldung erhalten!
        </h1>
        <p className="text-gray-500 mb-2 text-sm leading-relaxed">
          Vielen Dank für Ihre Meldung. Unser Team wurde benachrichtigt und kümmert sich schnellstmöglich darum.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-xl py-2.5 px-4 mb-8 mt-4">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          KI analysiert Ihre Meldung…
        </div>
        <button
          onClick={onReset}
          className="touch-feedback w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-base shadow-lg shadow-emerald-200/60 hover:bg-emerald-700 transition-colors"
        >
          Neue Meldung erstellen
        </button>
      </div>
    </div>
  );
}

function FilePreview({
  fileName,
  onRemove,
}: {
  fileName: string;
  onRemove: () => void;
}) {
  return (
    <div className="animate-fade-in-up flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
        <Camera className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 truncate">
          {fileName}
        </p>
        <p className="text-xs text-blue-500">Bereit zum Hochladen</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="touch-feedback w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
      >
        <X className="w-4 h-4 text-blue-600" />
      </button>
    </div>
  );
}

export default function MieterPage() {
  const {
    description,
    setDescription,
    fileName,
    status,
    fileInput,
    handleFileChange,
    submit,
    reset,
    clearFile,
  } = useTicketSubmit();

  if (status === "success") {
    return <SuccessView onReset={reset} />;
  }

  const isSending = status === "sending";
  const canSubmit = description.trim().length > 0 && !isSending;
  const charCount = description.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white flex flex-col">
      {/* App-like top bar */}
      <header className="animate-slide-down px-5 pt-12 pb-2">
        <Logo />
      </header>

      {/* Hero section */}
      <div className="animate-fade-in-up px-5 pt-4 pb-6">
        <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
          Schaden melden
        </h1>
        <p className="text-gray-400 mt-1 text-[15px]">
          Beschreiben Sie das Problem — unsere KI erledigt den Rest.
        </p>
      </div>

      {/* Form Card */}
      <form
        onSubmit={submit}
        className="animate-fade-in-up flex-1 flex flex-col mx-4 mb-4 bg-white rounded-3xl shadow-sm shadow-gray-200/80 border border-gray-100 overflow-hidden"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex-1 flex flex-col p-5 gap-4">
          {/* Textarea */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 w-full p-0 bg-transparent border-none outline-none text-[16px] leading-relaxed resize-none placeholder:text-gray-300 text-gray-800 min-h-[180px]"
              placeholder={"Was ist passiert?\n\nBeschreiben Sie z.B.:\n• Was genau kaputt ist\n• Wo sich der Schaden befindet\n• Seit wann das Problem besteht"}
              required
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
              <span className="text-xs text-gray-300">
                {charCount > 0 && `${charCount} Zeichen`}
              </span>
            </div>
          </div>

          {/* File Preview or Upload Button */}
          {fileName ? (
            <FilePreview fileName={fileName} onRemove={clearFile} />
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="touch-feedback flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-2xl px-4 py-3.5 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0">
                <ImagePlus className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Foto hinzufügen
                </p>
                <p className="text-xs text-gray-400">Optional – hilft bei der Einschätzung</p>
              </div>
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Sticky Submit */}
        <div className="p-4 pt-0">
          <button
            disabled={!canSubmit}
            type="submit"
            className="touch-feedback w-full flex items-center justify-center gap-2.5 bg-blue-600 text-white py-[14px] rounded-2xl text-base font-semibold shadow-lg shadow-blue-200/60 hover:bg-blue-700 transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Spinner className="w-5 h-5 text-white" />
                Wird gesendet…
              </>
            ) : (
              <>
                <Send className="w-[18px] h-[18px]" />
                Meldung absenden
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
