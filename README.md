# Binance Key Vault

Demo React app để lưu Binance API Key / Secret Key vào một vault cục bộ, có flow:

1. Nhập tên vault, API Key, Secret Key.
2. Chọn rule bảo vệ: chèn ký tự giả, đổi vị trí ký tự.
3. Bấm **Lưu vào Vault**.
4. Nhập mật khẩu, có thể bật **Face ID / Passkey** nếu thiết bị hỗ trợ.
5. Xem lại trong **Vault của tôi** bằng mật khẩu.

> Lưu ý: Đây là demo frontend. Phần token hiện tại là demo encode/xáo chuỗi để mô phỏng flow. Khi dùng thật cho key quan trọng, hãy thay bằng Web Crypto AES-GCM hoặc backend vault.

## Tech stack

- Vite
- React
- Tailwind CSS
- Framer Motion
- WebAuthn / Passkey demo
- Vitest

## Cài đặt

```bash
npm install
npm run dev
```

Mở:

```txt
http://localhost:5173
```

## Build production

```bash
npm run build
npm run preview
```

## Test

```bash
npm test
```

## Cấu trúc thư mục

```txt
src/
  components/
    InputBlock.jsx
    PasswordModal.jsx
    Toast.jsx
    ToggleCard.jsx
    VaultCard.jsx
  utils/
    encoding.js
    format.js
    noiseShuffle.js
    passkey.js
    storage.js
    vaultToken.js
  __tests__/
    noiseShuffle.test.js
    vaultToken.test.js
  App.jsx
  config.js
  index.css
  main.jsx
```

## Face ID / Passkey

Web không gọi trực tiếp Face ID. App dùng WebAuthn/Passkey. Khi chạy trên iPhone, Android, Mac hoặc Windows có hỗ trợ, hệ điều hành sẽ tự hiện Face ID, vân tay, Touch ID hoặc Windows Hello.

Điều kiện test Passkey:

- Chạy bằng `localhost`, hoặc
- Chạy trên domain có HTTPS.

## Bảo mật cần làm khi production

Bản demo hiện tại lưu dữ liệu vào `localStorage`. Với key thật, nên nâng cấp:

- Dùng Web Crypto `AES-GCM` với `PBKDF2`/`Argon2id` để tạo key từ mật khẩu.
- Không log API Key / Secret Key.
- Không lưu secret dạng plaintext.
- Backend tạo challenge WebAuthn và xác minh assertion.
- Server chỉ lưu public key của passkey, không bao giờ lưu dữ liệu sinh trắc học.
- Có cơ chế backup/recovery vì mất mật khẩu có thể mất khả năng giải mã.

## Ghi chú kỹ thuật

`Passkey` trong bản demo chỉ xác thực thiết bị trong trình duyệt. Nó chưa tự cấp khóa giải mã. Vì vậy flow xem lại vẫn cần mật khẩu để giải mã token.
# binance-key
