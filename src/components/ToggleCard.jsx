export function ToggleCard({ icon, title, desc, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed ${
        checked
          ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-fuchsia-50 shadow-md shadow-indigo-100/60"
          : "border-slate-200 bg-white/80 shadow-sm hover:border-indigo-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl text-lg ${checked ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            {icon}
          </span>
          <div>
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-sm leading-5 text-slate-500">{desc}</div>
          </div>
        </div>
        <div className={`mt-1 h-6 w-11 rounded-full p-1 transition ${checked ? "bg-indigo-600" : "bg-slate-200"}`}>
          <div className={`h-4 w-4 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>
    </button>
  );
}
