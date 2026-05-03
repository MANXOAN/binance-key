import { describe, expect, it } from "vitest";
import { applyMixedActions, insertNoise, normalizeEvery, removeNoise, reverseMixedActions, shuffleByPassword, swapByActions, unshuffleByPassword, unswapByActions } from "../utils/noiseShuffle";

describe("noise and shuffle helpers", () => {
  it("normalizes every value", () => {
    expect(normalizeEvery(1)).toBe(2);
    expect(normalizeEvery(20)).toBe(12);
    expect(normalizeEvery("bad")).toBe(5);
  });

  it("removes inserted noise", () => {
    const raw = "abcdef123456";
    const noisy = insertNoise(raw, 3, "ZX");
    expect(removeNoise(noisy, 3, "ZX")).toBe(raw);
  });

  it("keeps natural token matches that were not inserted noise", () => {
    const raw = "abcdZXef123456";
    const noisy = insertNoise(raw, 5, "ZX");
    expect(removeNoise(noisy, 5, "ZX")).toBe(raw);
  });

  it("unshuffles back to original", () => {
    const raw = "abcdefghijklmnopqrstuvwxyz";
    const password = "strong-password";
    const shuffled = shuffleByPassword(raw, password);
    expect(unshuffleByPassword(shuffled, password)).toBe(raw);
  });

  it("swaps positions inside each 12-character block", () => {
    const raw = "abcdefghijklmnopqrstuvwx";
    const swapped = swapByActions(raw, [
      { from: 1, to: 2 },
      { from: 4, to: 3 },
      { from: 6, to: 8 },
    ]);

    expect(swapped).toBe("badcehgfijklnmpoqtsruvwx");
    expect(unswapByActions(swapped, [
      { from: 1, to: 2 },
      { from: 4, to: 3 },
      { from: 6, to: 8 },
    ])).toBe(raw);
  });

  it("applies mixed actions in the exact order they were added", () => {
    const raw = "abcdefghi";
    const actions = [
      { type: "swap", from: 2, to: 3 },
      { type: "insert", position: 4, value: "friend" },
      { type: "swap", from: 6, to: 9 },
      { type: "wrap", prefix: "@@", suffix: "##" },
      { type: "shift", amount: 1 },
    ];
    const transformed = applyMixedActions(raw, actions);

    expect(transformed).toBe("AAbdcgsefojefghij$$");
    expect(reverseMixedActions(transformed, actions)).toBe(raw);
  });
});
