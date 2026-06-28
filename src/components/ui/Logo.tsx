export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-9 h-9" : "w-10 h-10";
  const text = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${dim} bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200/50`}
      >
        <span className={`text-white font-extrabold ${text} tracking-tight`}>
          SM
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900 leading-tight">
          SmartMaintain
        </span>
        <span className="text-[10px] text-gray-400 font-medium">
          Schadensmeldung
        </span>
      </div>
    </div>
  );
}
