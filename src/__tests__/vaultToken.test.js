import { describe, expect, it } from "vitest";
import { createVaultToken, parseVaultToken } from "../utils/vaultToken";

const apiKey = "bnc_live_x7H9aQ2mK4pR8sT1";
const secretKey = "sk_demo_Qw9Lm3Nx7ZaP6Ty2VcB8";
const text = "ABCDEFGHIJKL";
const password = "my-strong-password";

const cases = [
  { name: "base64 only", settings: { addNoise: false, shuffle: false, every: 5, noiseToken: "ZX" } },
  { name: "noise only", settings: { addNoise: true, shuffle: false, every: 4, noiseToken: "Q9" } },
  { name: "shuffle only", settings: { addNoise: false, shuffle: true, every: 5, noiseToken: "ZX" } },
  { name: "noise + shuffle", settings: { addNoise: true, shuffle: true, every: 5, noiseToken: "ZX" } },
  { name: "noise + manual swap actions", settings: { addNoise: true, shuffle: false, every: 5, noiseToken: "ZX", swapActions: [{ from: 1, to: 2 }, { from: 4, to: 3 }, { from: 6, to: 8 }] } },
];

describe("vault token demo crypto", () => {
  it.each(cases)("roundtrips $name", ({ settings }) => {
    const token = createVaultToken({
      apiKey,
      secretKey,
      password,
      authMethod: "password",
      passkey: null,
      ...settings,
    });

    const parsed = parseVaultToken({ token, password, settings });

    expect(parsed.ok).toBe(true);
    expect(parsed.data.apiKey).toBe(apiKey);
    expect(parsed.data.secretKey).toBe(secretKey);
  });

  it("fails with a wrong password when shuffle is enabled", () => {
    const settings = { addNoise: true, shuffle: true, every: 5, noiseToken: "ZX" };
    const token = createVaultToken({
      apiKey,
      secretKey,
      password,
      authMethod: "password",
      passkey: null,
      ...settings,
    });

    const parsed = parseVaultToken({ token, password: "wrong-password", settings });

    expect(parsed.ok).toBe(false);
  });

  it("roundtrips a single text value", () => {
    const settings = { addNoise: true, shuffle: false, every: 5, noiseToken: "ZX", swapActions: [{ from: 1, to: 2 }] };
    const token = createVaultToken({
      text,
      password,
      authMethod: "password",
      passkey: null,
      ...settings,
    });

    const parsed = parseVaultToken({ token, password, settings });

    expect(parsed.ok).toBe(true);
    expect(parsed.data.text).toBe(text);
  });
});
