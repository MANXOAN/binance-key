import { fromBase64, toBase64 } from "./encoding";
import { insertNoise, removeNoise, shuffleByPassword, swapByActions, unshuffleByPassword, unswapByActions } from "./noiseShuffle";

export function createVaultToken({ text, apiKey, secretKey, password, addNoise = true, shuffle = false, every, noiseToken, swapActions = [], authMethod, passkey }) {
  const data = text !== undefined ? { text } : { apiKey, secretKey };
  const payload = JSON.stringify({
    v: 1,
    alg: "AES-256-GCM-ready-demo",
    authMethod,
    hasPasskey: Boolean(passkey?.id),
    passkeyIdPreview: passkey?.id ? `${passkey.id.slice(0, 8)}...` : null,
    createdAt: new Date().toISOString(),
    data,
  });

  let output = toBase64(payload);
  if (addNoise) output = insertNoise(output, every, noiseToken);
  if (swapActions?.length) output = swapByActions(output, swapActions);
  if (shuffle) output = shuffleByPassword(output, password);
  return `BKC.${output}`;
}

export function parseVaultToken({ token, password, settings }) {
  if (!token?.startsWith("BKC.")) {
    return { ok: false, message: "Không có chuỗi mã hóa hợp lệ." };
  }

  let raw = token.replace(/^BKC\./, "");
  if (settings.shuffle) raw = unshuffleByPassword(raw, password);
  if (settings.swapActions?.length) raw = unswapByActions(raw, settings.swapActions);
  if (settings.addNoise) raw = removeNoise(raw, settings.every, settings.noiseToken || "ZX");

  const decoded = fromBase64(raw);
  if (!decoded) return { ok: false, message: "Không đọc được chuỗi. Kiểm tra lại mật khẩu." };

  try {
    const parsed = JSON.parse(decoded);
    if (!parsed?.data?.text && (!parsed?.data?.apiKey || !parsed?.data?.secretKey)) {
      return { ok: false, message: "Chuỗi đọc được nhưng thiếu dữ liệu." };
    }
    return { ok: true, data: parsed.data, meta: parsed };
  } catch {
    return { ok: false, message: "Mật khẩu không đúng hoặc rule mã hóa không khớp." };
  }
}
