import { VAULT_STORAGE_KEY } from "../config";

export function loadVaultItems() {
  try {
    return JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveVaultItems(items) {
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
}

export function clearVaultItems() {
  localStorage.removeItem(VAULT_STORAGE_KEY);
}
