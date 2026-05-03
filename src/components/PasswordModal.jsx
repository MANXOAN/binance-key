import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createLocalPasskey } from "../utils/passkey";
import { getPasswordStrength, passwordStrengthLabel } from "../utils/format";
import { InputBlock } from "./InputBlock";

export function PasswordModal({ open, onClose, onConfirm, passkeySupported, passkeyChecked }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [passkey, setPasskey] = useState(null);
  const [passkeyStatus, setPasskeyStatus] = useState("idle");
  const [passkeyMessage, setPasskeyMessage] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmPassword("");
      setShow(false);
      setError("");
      setPasskey(null);
      setPasskeyStatus("idle");
      setPasskeyMessage("");
    }
  }, [open]);

  const score = getPasswordStrength(password);
  const strengthLabel = passwordStrengthLabel(score);
  const canSave = password.length >= 8 && password === confirmPassword;

  const handleCreatePasskey = async () => {
    setError("");
    setPasskeyMessage("");

    if (!passkeySupported) {
      setPasskeyStatus("error");
      setPasskeyMessage("Thiết bị/trình duyệt chưa hỗ trợ Passkey hoặc chưa chạy HTTPS/localhost.");
      return;
    }

    try {
      setPasskeyStatus("loading");
      const created = await createLocalPasskey();
      setPasskey(created);
      setPasskeyStatus("success");
      setPasskeyMessage("Đã tạo Passkey thành công. Nếu dùng iPhone, bước này có thể hiện Face ID.");
    } catch (err) {
      setPasskey(null);
      setPasskeyStatus("error");
      setPasskeyMessage(err?.message || "Không tạo được Passkey.");
    }
  };

  const handleConfirm = () => {
    if (password.length < 8) {
      setError("Mật khẩu nên có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    onConfirm({ password, authMethod: passkey ? "password + passkey" : "password", passkey });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-900/20"
          >
            <div className="relative border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-6">
              <button onClick={onClose} className="absolute right-4 top-4 rounded-2xl bg-white/80 px-3 py-2 text-slate-500 shadow-sm transition hover:text-slate-900">
                ✕
              </button>
              <div className="mb-4 inline-flex rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">🔐</div>
              <h2 className="text-2xl font-black text-slate-950">Tạo mật khẩu bảo vệ</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mật khẩu này dùng để giải mã lại item trong Vault. Passkey/Face ID là lớp xác thực thêm.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Master Password</span>
                  <span className="text-indigo-600">{strengthLabel}</span>
                </div>
                <div className="relative">
                  <input
                    autoFocus
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={show ? "text" : "password"}
                    placeholder="Nhập mật khẩu bảo vệ"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 pr-14 outline-none transition focus:border-indigo-300 focus:shadow-lg focus:shadow-indigo-100"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                    {show ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all" style={{ width: `${Math.max(10, score * 20)}%` }} />
                </div>
              </div>

              <InputBlock label="Nhập lại mật khẩu" icon="✅" value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu" secret />

              <button
                type="button"
                onClick={handleCreatePasskey}
                disabled={!passkeySupported || passkeyStatus === "loading"}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  passkeyStatus === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : passkeyStatus === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🧬</span>
                  <div>
                    <div className="font-bold">{passkeyStatus === "loading" ? "Đang xin Face ID / Passkey..." : passkey ? "Đã bật Face ID / Passkey" : "Bật Face ID / Passkey"}</div>
                    <div className="mt-1 text-sm leading-5">
                      {passkeyMessage ||
                        (passkeyChecked
                          ? passkeySupported
                            ? "Bấm để tạo Passkey thật bằng WebAuthn. Cần localhost hoặc HTTPS."
                            : "Thiết bị hoặc trình duyệt hiện tại chưa hỗ trợ Passkey/WebAuthn."
                          : "Đang kiểm tra thiết bị...")}
                    </div>
                  </div>
                </div>
              </button>

              {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-600 transition hover:bg-slate-50">
                  Hủy
                </button>
                <button onClick={handleConfirm} disabled={!canSave} className="rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">
                  Xác nhận lưu
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
