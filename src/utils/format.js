export function uid(prefix = "vault") {
  const random = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now()}_${random}`;
}

export function maskText(value) {
  if (!value) return "";
  if (value.length <= 10) return "•".repeat(value.length);
  return `${value.slice(0, 6)}${"•".repeat(Math.min(18, value.length - 10))}${value.slice(-4)}`;
}

export function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 14) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function passwordStrengthLabel(score) {
  return ["Rất yếu", "Yếu", "Tạm ổn", "Ổn", "Mạnh", "Rất mạnh"][score] || "Rất yếu";
}
