import { useState } from "react";

export function InputBlock({ label, value, onChange, placeholder, secret = false, icon = "🔐", className = "" }) {
  const [show, setShow] = useState(false);

  return (
    <label className={`block ${className}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span>{icon}</span>
        {label}
      </div>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={secret && !show ? "password" : "text"}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:shadow-lg focus:shadow-indigo-100"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={show ? "Ẩn nội dung" : "Hiện nội dung"}
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </label>
  );
}
