import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { CACHE_TTL_MS } from "../constants/api";

// ─── Secure token storage ──────────────────────────────────────────────────
export async function saveToken(token) {
  await SecureStore.setItemAsync("kanthast_token", token);
}

export async function getToken() {
  return SecureStore.getItemAsync("kanthast_token");
}

export async function removeToken() {
  await SecureStore.deleteItemAsync("kanthast_token");
}

export async function saveUser(user) {
  await AsyncStorage.setItem("kanthast_user", JSON.stringify(user));
}

export async function getUser() {
  const raw = await AsyncStorage.getItem("kanthast_user");
  return raw ? JSON.parse(raw) : null;
}

export async function removeUser() {
  await AsyncStorage.removeItem("kanthast_user");
}

// ─── Generic TTL cache ─────────────────────────────────────────────────────
export async function readCache(key, ttlMs = CACHE_TTL_MS) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    return Date.now() - cachedAt < ttlMs ? data : null;
  } catch {
    return null;
  }
}

export async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // ignore write errors
  }
}

export async function invalidateCache(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── Clear all app data (logout) ──────────────────────────────────────────
export async function clearAllAppData() {
  await removeToken();
  await removeUser();
  const keys = await AsyncStorage.getAllKeys();
  const appKeys = keys.filter((k) => k.startsWith("kanthast_"));
  if (appKeys.length) await AsyncStorage.multiRemove(appKeys);
}
