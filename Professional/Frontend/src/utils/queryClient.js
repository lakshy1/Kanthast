import { QueryClient } from "@tanstack/react-query";
import { del, get, set } from "idb-keyval";

const TOKEN_KEY = "kanthastAdminToken";
const IDB_KEY = "kanthastProQueryCache_v1";

function currentToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const idbPersister = {
  persistClient: async (client) => {
    const token = currentToken();
    if (!token) return;
    await set(IDB_KEY, { token, client });
  },
  restoreClient: async () => {
    const token = currentToken();
    if (!token) return undefined;
    const entry = await get(IDB_KEY);
    if (!entry || entry.token !== token) return undefined;
    return entry.client;
  },
  removeClient: async () => {
    await del(IDB_KEY);
  },
};

if (typeof window !== "undefined") {
  let lastToken = currentToken();
  const syncAuthCache = () => {
    const next = currentToken();
    if (next !== lastToken) {
      lastToken = next;
      queryClient.clear();
      del(IDB_KEY).catch(() => {});
    }
  };
  window.addEventListener("storage", (e) => {
    if (!e.key || e.key === TOKEN_KEY) syncAuthCache();
  });
}
