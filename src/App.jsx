import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { demoData } from "./config";
import { Toast } from "./components/Toast";
import { applyMixedActions, normalizeActionPosition, normalizeMixedActions, reverseMixedActions } from "./utils/noiseShuffle";

const TOKEN_PREFIX = "CAV1.";

const encodeBase64Url = (value) =>
  btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return decodeURIComponent(escape(atob(padded)));
};

const createProtectedCode = ({ input, actions }) => {
  const safeActions = normalizeMixedActions(actions);
  const output = applyMixedActions(input, safeActions);
  return `${TOKEN_PREFIX}${encodeBase64Url(
    JSON.stringify({
      v: 1,
      output,
      actions: safeActions,
    }),
  )}`;
};

const createProtectedResult = ({ input, actions }) => {
  const safeActions = normalizeMixedActions(actions);
  const output = applyMixedActions(input, safeActions);
  return {
    output,
    code: createProtectedCode({ input, actions: safeActions }),
  };
};

const parseProtectedCode = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed.startsWith(TOKEN_PREFIX)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(trimmed.slice(TOKEN_PREFIX.length)));
    const actions = normalizeMixedActions(payload.actions || []);
    if (!payload.output || !actions.length) return null;
    return {
      output: String(payload.output),
      actions,
    };
  } catch {
    return null;
  }
};

const actionText = (action) => {
  if (action.type === "insert") return `Chèn "${action.value}" tại vị trí ${action.position}`;
  if (action.type === "wrap") return `Bọc "${action.prefix}" ... "${action.suffix}"`;
  if (action.type === "shift") return `Dịch ký tự +${action.amount}`;
  return `Đổi vị trí ${action.from} ↔ ${action.to}`;
};

export default function App() {
  const [textValue, setTextValue] = useState("");
  const [decodeValue, setDecodeValue] = useState("");
  const [actionType, setActionType] = useState("swap");
  const [swapFrom, setSwapFrom] = useState(1);
  const [swapTo, setSwapTo] = useState(2);
  const [insertPosition, setInsertPosition] = useState(4);
  const [insertValue, setInsertValue] = useState("friend");
  const [wrapPrefix, setWrapPrefix] = useState("@@");
  const [wrapSuffix, setWrapSuffix] = useState("##");
  const [shiftAmount, setShiftAmount] = useState(1);
  const [actions, setActions] = useState([]);
  const [savedResult, setSavedResult] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [toast, setToast] = useState("");
  const [plainLabel, setPlainLabel] = useState("Chuỗi gốc");

  const normalizedActions = useMemo(() => normalizeMixedActions(actions), [actions]);

  const hasInput = Boolean(textValue.trim());
  const hasEncryptedInput = Boolean(decodeValue.trim());

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadDataUrl = (dataUrl, filename) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopy = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
      showToast("Đã copy");
    } catch {
      showToast("Không copy được trong trình duyệt này");
    }
  };

  const handleSave = async () => {
    if (!decodeValue.trim()) {
      showToast("Chưa có chuỗi mã hóa để lưu");
      return;
    }

    const createdAt = new Date().toISOString();
    const parsedCode = parseProtectedCode(decodeValue);
    const safeActions = parsedCode?.actions || normalizedActions;
    if (!safeActions.length) {
      showToast("Chưa có quy tắc để lưu");
      return;
    }

    const result = {
      input: textValue,
      output: decodeValue,
      actions: safeActions,
      createdAt,
    };

    const qr = await QRCode.toDataURL(decodeValue, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
    });

    setSavedResult(result);
    setQrDataUrl(qr);
    setTextValue("");
    setDecodeValue("");
    setPlainLabel("Chuỗi gốc");
    setActionType("swap");
    setSwapFrom(1);
    setSwapTo(2);
    setInsertPosition(4);
    setInsertValue("friend");
    setWrapPrefix("@@");
    setWrapSuffix("##");
    setShiftAmount(1);
    setActions([]);
    showToast("Đã tạo file/QR và clear form");
  };

  const handleEncode = () => {
    if (!hasInput) {
      showToast("Nhập chuỗi gốc trước khi mã hóa");
      return;
    }

    if (!normalizedActions.length) {
      showToast("Thêm ít nhất 1 action ở cột 2");
      return;
    }

    const result = createProtectedResult({ input: textValue, actions: normalizedActions });
    if (result.output === textValue) {
      setDecodeValue("");
      showToast("Quy tắc ở cột 2 chưa làm chuỗi thay đổi");
      return;
    }

    setDecodeValue(result.code);
    setPlainLabel("Chuỗi gốc");
    setSavedResult(null);
    setQrDataUrl("");
    showToast("Đã mã hóa sang cột 3");
  };

  const handleDecode = () => {
    if (!hasEncryptedInput) {
      showToast("Nhập chuỗi đã mã hóa trước khi giải mã");
      return;
    }

    const parsedCode = parseProtectedCode(decodeValue);
    const decodeActions = parsedCode?.actions || normalizedActions;
    const encryptedText = parsedCode?.output || decodeValue;
    if (!decodeActions.length) {
      showToast("Mã này không có quy tắc, hãy thêm đúng quy tắc ở cột 2");
      return;
    }

    if (parsedCode) setActions(parsedCode.actions);
    setTextValue(reverseMixedActions(encryptedText, decodeActions));
    setPlainLabel("Kết quả giải mã");
    setSavedResult(null);
    setQrDataUrl("");
    showToast("Đã giải mã về cột 1");
  };

  const handleDownloadJson = () => {
    if (!savedResult) return;
    downloadBlob(JSON.stringify(savedResult, null, 2), "character-actions.json", "application/json;charset=utf-8");
  };

  const handleDownloadTxt = () => {
    if (!savedResult) return;
    downloadBlob(savedResult.output, "character-actions.txt", "text/plain;charset=utf-8");
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    downloadDataUrl(qrDataUrl, "character-actions-qr.png");
  };

  const loadDemo = () => {
    setTextValue(demoData.text);
    setActionType("swap");
    setSwapFrom(2);
    setSwapTo(3);
    setInsertPosition(4);
    setInsertValue("friend");
    setActions([
      { type: "swap", from: 2, to: 3 },
      { type: "insert", position: 4, value: "friend" },
      { type: "swap", from: 6, to: 9 },
    ]);
    setDecodeValue("");
    setPlainLabel("Chuỗi gốc");
    setSavedResult(null);
    setQrDataUrl("");
  };

  const handleAddAction = () => {
    let action;
    if (actionType === "insert") {
      action = {
        type: "insert",
        position: normalizeActionPosition(insertPosition),
        value: insertValue,
      };
      if (!action.value) {
        showToast("Nhập chữ cần chèn");
        return;
      }
    } else if (actionType === "wrap") {
      action = {
        type: "wrap",
        prefix: wrapPrefix,
        suffix: wrapSuffix,
      };
      if (!action.prefix && !action.suffix) {
        showToast("Nhập đầu hoặc cuối để bọc");
        return;
      }
    } else if (actionType === "shift") {
      action = {
        type: "shift",
        amount: Number(shiftAmount),
      };
      if (!Number.isFinite(action.amount) || action.amount === 0) {
        showToast("Nhập số dịch khác 0");
        return;
      }
    } else {
      action = {
        type: actionType,
        from: normalizeActionPosition(swapFrom),
        to: normalizeActionPosition(swapTo),
      };
      if (action.from === action.to) {
        showToast("Chọn 2 vị trí khác nhau");
        return;
      }
    }

    const nextActions = [...actions, action];
    setActions(nextActions);
    if (hasInput) {
      const result = createProtectedResult({ input: textValue, actions: nextActions });
      setDecodeValue(result.output === textValue ? "" : result.code);
    }
    setSavedResult(null);
    setQrDataUrl("");
  };

  const handleRemoveAction = (indexToRemove) => {
    const nextActions = actions.filter((_, index) => index !== indexToRemove);
    setActions(nextActions);
    if (hasInput) {
      const result = createProtectedResult({ input: textValue, actions: nextActions });
      setDecodeValue(nextActions.length && result.output !== textValue ? result.code : "");
    }
    setSavedResult(null);
    setQrDataUrl("");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_32%),radial-gradient(circle_at_top_right,_#fdf2f8,_transparent_30%),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-4 text-slate-900 sm:p-6 lg:p-8">
      <Toast message={toast} />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-2xl shadow-indigo-100/70 backdrop-blur-xl"
        >
          <div className="relative overflow-hidden border-b border-slate-100 px-5 py-6 sm:px-8 lg:px-10">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-200/40 blur-3xl" />
            <div className="absolute right-24 top-4 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
                ✨ Character Actions
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Mã hóa và giải mã theo quy tắc riêng.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Cột 1 là chuỗi gốc, cột 2 là bộ quy tắc, cột 3 là chuỗi đã mã hóa. Quy tắc chạy tuần tự khi mã hóa và chạy ngược lại khi giải mã.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                    🔤 Thiết lập
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">Công cụ 2 chiều</h2>
                </div>

                <button
                  type="button"
                  onClick={loadDemo}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md"
                >
                  <span>🔄</span>
                  Demo
                </button>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-black text-slate-950">1. {plainLabel}</h3>
                  <label className="mt-4 block">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span>🔤</span>
                      Nhập ký tự
                    </div>
                    <textarea
                      value={textValue}
                      onChange={(event) => {
                        setTextValue(event.target.value);
                        setPlainLabel("Chuỗi gốc");
                        setSavedResult(null);
                        setQrDataUrl("");
                      }}
                      placeholder="Nhập chuỗi chưa mã hóa, hoặc xem kết quả giải mã ở đây"
                      className="min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 font-mono text-base font-bold text-slate-900 outline-none transition placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-400">
                      <span>{textValue.length} ký tự</span>
                      {plainLabel === "Kết quả giải mã" && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">Đã giải mã</span>}
                    </div>
                  </label>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="font-black text-slate-950">2. Actions tuần tự</h3>
                        <p className="mt-1 text-sm leading-5 text-slate-500">Ví dụ: đổi 2 ↔ 3, chèn friend tại 4, đổi 6 ↔ 9.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActions([]);
                          setDecodeValue("");
                          setPlainLabel("Chuỗi gốc");
                          setSavedResult(null);
                          setQrDataUrl("");
                        }}
                        className="text-left text-sm font-bold text-slate-500 transition hover:text-rose-600 sm:text-right"
                      >
                        Xóa hết
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5">
                      <button
                        type="button"
                        onClick={() => setActionType("swap")}
                        className={`rounded-xl px-4 py-3 text-sm font-black transition ${actionType === "swap" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        Đổi vị trí
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionType("insert")}
                        className={`rounded-xl px-4 py-3 text-sm font-black transition ${actionType === "insert" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        Chèn chữ
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionType("wrap")}
                        className={`rounded-xl px-4 py-3 text-sm font-black transition ${actionType === "wrap" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        Bọc mã
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionType("shift")}
                        className={`rounded-xl px-4 py-3 text-sm font-black transition ${actionType === "shift" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        Dịch ký tự
                      </button>
                    </div>

                    {actionType === "swap" ? (
                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                        <label>
                          <div className="mb-2 text-sm font-semibold text-slate-700">Vị trí A</div>
                          <input
                            value={swapFrom}
                            onChange={(event) => setSwapFrom(event.target.value)}
                            type="number"
                            min="1"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
                          />
                        </label>
                        <div className="pb-3 text-lg font-black text-slate-400">↔</div>
                        <label>
                          <div className="mb-2 text-sm font-semibold text-slate-700">Vị trí B</div>
                          <input
                            value={swapTo}
                            onChange={(event) => setSwapTo(event.target.value)}
                            type="number"
                            min="1"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
                          />
                        </label>
                      </div>
                    ) : actionType === "insert" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                        <label>
                          <div className="mb-2 text-sm font-semibold text-slate-700">Chèn tại vị trí</div>
                          <input
                            value={insertPosition}
                            onChange={(event) => setInsertPosition(event.target.value)}
                            type="number"
                            min="1"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
                          />
                        </label>
                        <label>
                          <div className="mb-2 text-sm font-semibold text-slate-700">Chữ cần chèn</div>
                          <input
                            value={insertValue}
                            onChange={(event) => setInsertValue(event.target.value)}
                            placeholder="friend"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
                          />
                        </label>
                      </div>
                    ) : actionType === "wrap" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label>
                          <div className="mb-2 text-sm font-semibold text-slate-700">Thêm ở đầu</div>
                          <input
                            value={wrapPrefix}
                            onChange={(event) => setWrapPrefix(event.target.value)}
                            placeholder="@@"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
                          />
                        </label>
                        <label>
                          <div className="mb-2 text-sm font-semibold text-slate-700">Thêm ở cuối</div>
                          <input
                            value={wrapSuffix}
                            onChange={(event) => setWrapSuffix(event.target.value)}
                            placeholder="##"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="mt-4 block">
                        <div className="mb-2 text-sm font-semibold text-slate-700">Dịch mỗi ký tự thêm</div>
                        <input
                          value={shiftAmount}
                          onChange={(event) => setShiftAmount(event.target.value)}
                          type="number"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-300"
                        />
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={handleAddAction}
                      className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:-translate-y-0.5"
                    >
                      Thêm action
                    </button>

                    <div className="mt-4 grid gap-2">
                      {normalizedActions.length ? (
                        normalizedActions.map((action, index) => (
                          <button
                            key={`${action.type}-${index}`}
                            type="button"
                            onClick={() => handleRemoveAction(index)}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-white px-3 py-2 text-left text-sm font-bold text-indigo-700 shadow-sm transition hover:border-rose-200 hover:text-rose-600"
                          >
                            <span>{index + 1}. {actionText(action)}</span>
                            <span className="text-xs text-slate-400">Xóa</span>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-sm font-semibold text-slate-400">
                          Chưa có action nào.
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleEncode}
                        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-indigo-700"
                      >
                        Hoàn tất quy tắc và mã hóa sang cột 3
                      </button>
                    </div>
                  </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/60">
                  <div className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">3. Chuỗi đã mã hóa</div>
                  <h3 className="mt-4 font-black text-white">Kết quả mã hóa</h3>
                  <textarea
                    value={decodeValue}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setDecodeValue(nextValue);
                      if (!nextValue.trim()) {
                        setTextValue("");
                        setPlainLabel("Chuỗi gốc");
                        setActions([]);
                      }
                      setSavedResult(null);
                      setQrDataUrl("");
                    }}
                    placeholder="Kết quả mã hóa sẽ nằm ở đây, hoặc dán chuỗi đã mã hóa để giải mã"
                    className="mt-4 min-h-64 w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-mono text-xs leading-6 text-indigo-50 outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-slate-500 focus:border-indigo-300"
                  />
                  <div className="mt-2 text-sm font-semibold text-slate-400">{decodeValue.length} ký tự</div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleDecode}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-400 px-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300"
                    >
                      Giải mã về cột 1
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                    >
                      Lưu
                    </button>
                  </div>

                  {hasEncryptedInput ? (
                    <button
                      type="button"
                      onClick={() => handleCopy(decodeValue)}
                      className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 px-4 text-sm font-bold text-indigo-50 transition hover:bg-white/10"
                    >
                      Copy chuỗi mã hóa
                    </button>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm font-semibold leading-6 text-slate-400">
                      Chưa có chuỗi mã hóa.
                    </div>
                  )}

                  {savedResult && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-bold text-indigo-100">Chọn cách lưu</div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <button type="button" onClick={handleDownloadJson} className="rounded-xl bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                          File JSON
                        </button>
                        <button type="button" onClick={handleDownloadTxt} className="rounded-xl bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                          File TXT
                        </button>
                        <button type="button" onClick={handleDownloadQr} className="rounded-xl bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                          QR code
                        </button>
                      </div>
                      {qrDataUrl && (
                        <div className="rounded-2xl bg-white p-3">
                          <img src={qrDataUrl} alt="QR code chứa kết quả" className="mx-auto h-44 w-44" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
