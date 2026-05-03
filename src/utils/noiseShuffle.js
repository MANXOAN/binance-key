export function normalizeEvery(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(12, Math.max(2, Math.floor(parsed)));
}

export function insertNoise(value, every = 5, token = "ZX") {
  const safeEvery = normalizeEvery(every);
  const safeToken = token || "ZX";
  if (!value) return "";
  return value
    .split("")
    .map((char, index) => ((index + 1) % safeEvery === 0 ? `${char}${safeToken}` : char))
    .join("");
}

export function removeNoise(value, every = 5, token = "ZX") {
  const safeEvery = normalizeEvery(every);
  const safeToken = token || "ZX";
  if (!value) return "";

  let output = "";
  let sourceIndex = 0;

  while (sourceIndex < value.length) {
    output += value.slice(sourceIndex, sourceIndex + safeEvery);
    sourceIndex += safeEvery;

    if (value.slice(sourceIndex, sourceIndex + safeToken.length) === safeToken) {
      sourceIndex += safeToken.length;
    }
  }

  return output;
}

export function normalizeSwapPosition(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(12, Math.max(1, Math.floor(parsed)));
}

export function normalizeSwapActions(actions = []) {
  return actions
    .map((action) => ({
      type: "swap",
      from: normalizeSwapPosition(action.from),
      to: normalizeSwapPosition(action.to),
    }))
    .filter((action) => action.from !== action.to);
}

export function normalizeActionPosition(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

export function normalizeMixedActions(actions = []) {
  return actions
    .map((action) => {
      if (action.type === "insert") {
        return {
          type: "insert",
          position: normalizeActionPosition(action.position),
          value: String(action.value || ""),
        };
      }

      if (action.type === "reverse") {
        return {
          type: "reverse",
          from: normalizeActionPosition(action.from),
          to: normalizeActionPosition(action.to),
        };
      }

      if (action.type === "move") {
        return {
          type: "move",
          from: normalizeActionPosition(action.from),
          to: normalizeActionPosition(action.to),
        };
      }

      if (action.type === "wrap") {
        return {
          type: "wrap",
          prefix: String(action.prefix || ""),
          suffix: String(action.suffix || ""),
        };
      }

      if (action.type === "shift") {
        const parsed = Number(action.amount);
        return {
          type: "shift",
          amount: Number.isFinite(parsed) ? Math.floor(parsed) : 1,
        };
      }

      return {
        type: "swap",
        from: normalizeActionPosition(action.from),
        to: normalizeActionPosition(action.to),
      };
    })
    .filter((action) => {
      if (action.type === "insert") return action.value.length > 0;
      if (action.type === "wrap") return action.prefix.length > 0 || action.suffix.length > 0;
      if (action.type === "shift") return action.amount !== 0;
      return action.from !== action.to;
    });
}

function reverseRange(value, from, to) {
  const chars = value.split("");
  const start = Math.min(from, to) - 1;
  const end = Math.max(from, to) - 1;
  if (start >= chars.length || end >= chars.length) return value;
  const reversed = chars.slice(start, end + 1).reverse();
  chars.splice(start, reversed.length, ...reversed);
  return chars.join("");
}

function moveCharacter(value, from, to) {
  const chars = value.split("");
  const fromIndex = from - 1;
  const toIndex = to - 1;
  if (fromIndex >= chars.length || toIndex >= chars.length) return value;
  const [char] = chars.splice(fromIndex, 1);
  chars.splice(toIndex, 0, char);
  return chars.join("");
}

function shiftText(value, amount) {
  return Array.from(value)
    .map((char) => String.fromCodePoint(char.codePointAt(0) + amount))
    .join("");
}

export function applyMixedActions(value, actions = []) {
  let output = value || "";

  for (const action of normalizeMixedActions(actions)) {
    if (action.type === "insert") {
      const index = Math.min(output.length, action.position - 1);
      output = `${output.slice(0, index)}${action.value}${output.slice(index)}`;
      continue;
    }

    if (action.type === "reverse") {
      output = reverseRange(output, action.from, action.to);
      continue;
    }

    if (action.type === "move") {
      output = moveCharacter(output, action.from, action.to);
      continue;
    }

    if (action.type === "wrap") {
      output = `${action.prefix}${output}${action.suffix}`;
      continue;
    }

    if (action.type === "shift") {
      output = shiftText(output, action.amount);
      continue;
    }

    const chars = output.split("");
    const fromIndex = action.from - 1;
    const toIndex = action.to - 1;
    if (fromIndex < chars.length && toIndex < chars.length) {
      [chars[fromIndex], chars[toIndex]] = [chars[toIndex], chars[fromIndex]];
      output = chars.join("");
    }
  }

  return output;
}

export function reverseMixedActions(value, actions = []) {
  let output = value || "";
  const normalizedActions = normalizeMixedActions(actions);

  for (let index = normalizedActions.length - 1; index >= 0; index -= 1) {
    const action = normalizedActions[index];
    if (action.type === "insert") {
      const start = Math.min(output.length, action.position - 1);
      if (output.slice(start, start + action.value.length) === action.value) {
        output = `${output.slice(0, start)}${output.slice(start + action.value.length)}`;
      }
      continue;
    }

    if (action.type === "reverse") {
      output = reverseRange(output, action.from, action.to);
      continue;
    }

    if (action.type === "move") {
      output = moveCharacter(output, action.to, action.from);
      continue;
    }

    if (action.type === "wrap") {
      const hasPrefix = action.prefix ? output.startsWith(action.prefix) : true;
      const hasSuffix = action.suffix ? output.endsWith(action.suffix) : true;
      if (hasPrefix && hasSuffix) {
        output = output.slice(action.prefix.length, output.length - action.suffix.length);
      }
      continue;
    }

    if (action.type === "shift") {
      output = shiftText(output, -action.amount);
      continue;
    }

    const chars = output.split("");
    const fromIndex = action.from - 1;
    const toIndex = action.to - 1;
    if (fromIndex < chars.length && toIndex < chars.length) {
      [chars[fromIndex], chars[toIndex]] = [chars[toIndex], chars[fromIndex]];
      output = chars.join("");
    }
  }

  return output;
}

export function swapByActions(value, actions = [], blockSize = 12) {
  if (!value) return "";
  const normalizedActions = normalizeSwapActions(actions);
  if (!normalizedActions.length) return value;

  const chars = value.split("");
  for (let offset = 0; offset < chars.length; offset += blockSize) {
    for (const { from, to } of normalizedActions) {
      const fromIndex = offset + from - 1;
      const toIndex = offset + to - 1;
      if (fromIndex < chars.length && toIndex < chars.length) {
        [chars[fromIndex], chars[toIndex]] = [chars[toIndex], chars[fromIndex]];
      }
    }
  }

  return chars.join("");
}

export function unswapByActions(value, actions = [], blockSize = 12) {
  return swapByActions(value, normalizeSwapActions(actions).reverse(), blockSize);
}

export function createShuffleSwaps(length, password) {
  let seed = Array.from(password || "").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const swaps = [];

  for (let i = length - 1; i > 0; i -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    swaps.push([i, seed % (i + 1)]);
  }

  return swaps;
}

export function shuffleByPassword(value, password) {
  if (!value || !password) return value;
  const chars = value.split("");
  const swaps = createShuffleSwaps(chars.length, password);

  for (const [i, j] of swaps) {
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export function unshuffleByPassword(value, password) {
  if (!value || !password) return value;
  const chars = value.split("");
  const swaps = createShuffleSwaps(chars.length, password);

  for (let index = swaps.length - 1; index >= 0; index -= 1) {
    const [i, j] = swaps[index];
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
