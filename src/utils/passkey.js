import { base64UrlToBuffer, bufferToBase64Url } from "./encoding";

export function isSecurePasskeyContext() {
  return typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");
}

export function randomBytes(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

export async function checkPasskeySupport() {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  if (!isSecurePasskeyContext()) return false;

  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
      return true;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function createLocalPasskey() {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error("Trình duyệt hiện tại chưa hỗ trợ Passkey/WebAuthn.");
  }
  if (!isSecurePasskeyContext()) {
    throw new Error("Passkey cần HTTPS hoặc localhost để hoạt động.");
  }

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: {
        name: "Binance Key Vault Demo",
        id: window.location.hostname,
      },
      user: {
        id: randomBytes(16),
        name: "vault-user@example.com",
        displayName: "Binance Key Vault User",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        requireResidentKey: false,
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
    },
  });

  if (!credential) throw new Error("Người dùng đã hủy hoặc thiết bị không tạo được Passkey.");

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    createdAt: new Date().toISOString(),
  };
}

export async function verifyLocalPasskey(passkey) {
  if (!passkey?.rawId) throw new Error("Chưa có Passkey đã tạo cho item này.");
  if (!window.PublicKeyCredential || !navigator.credentials?.get) {
    throw new Error("Trình duyệt hiện tại chưa hỗ trợ mở khóa bằng Passkey.");
  }
  if (!isSecurePasskeyContext()) throw new Error("Passkey cần HTTPS hoặc localhost để hoạt động.");

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [
        {
          id: base64UrlToBuffer(passkey.rawId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });

  if (!assertion) throw new Error("Người dùng đã hủy hoặc xác thực Passkey thất bại.");
  return true;
}
