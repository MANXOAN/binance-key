# Security Notes

This repository is a polished frontend demo for vault flow and UI validation.

Do not use the demo token encoder for real secrets in production. For production, implement:

- Web Crypto AES-GCM encryption.
- A password-based key derivation function such as PBKDF2 or Argon2id.
- Backend-generated WebAuthn challenges.
- Backend verification for WebAuthn assertions.
- Secure error handling and no secret logging.
- Recovery policy for lost password/passkey.

Recommended production model:

1. User enters password.
2. App derives an encryption key using KDF + salt.
3. App encrypts Binance key using AES-GCM.
4. Store only ciphertext, IV, salt, KDF parameters, and metadata.
5. Use Passkey only to authenticate the user before releasing vault access.
