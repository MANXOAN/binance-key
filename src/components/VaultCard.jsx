export function VaultCard({ item, onView, onDelete, onCopy }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-xl shadow-slate-200/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{item.authMethod}</div>
          <h3 className="mt-3 text-xl font-black text-slate-950">{item.name}</h3>
          <p className="mt-1 text-sm text-slate-500">Lưu lúc: {item.createdAtText}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">Noise: {item.settings.addNoise ? "On" : "Off"}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Shuffle: {item.settings.shuffle ? "On" : "Off"}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Token: {item.settings.noiseToken}</span>
            {item.passkey && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Passkey</span>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-64">
          <button onClick={() => onView(item)} className="rounded-2xl bg-slate-950 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5">
            Xem
          </button>
          <button onClick={() => onCopy(item)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Copy
          </button>
          <button onClick={() => onDelete(item.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
            Xóa
          </button>
        </div>
      </div>
      <div className="mt-4 max-h-24 overflow-auto rounded-2xl bg-slate-950 p-3 font-mono text-xs leading-5 text-indigo-50">
        {item.encryptedToken}
      </div>
    </div>
  );
}
