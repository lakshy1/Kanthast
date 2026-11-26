import { QueryClient } from "@tanstack/react-query";
import { del, get, set } from "idb-keyval";
import { getProfile } from "./authApi";
import {
  getFlashcardHistory,
  getFlashcardStats,
  getMcqHistory,
  getMcqStats,
  getVivaHistory,
  getVivaStats,
} from "./practiceApi";

const TOKEN_KEY = "kanthastSchoolToken";
const IDB_KEY = "kanthastQueryCache_v1";

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
      staleTime: 2 * 60 * 1000, // 2 min fresh window across module switches
      gcTime: 30 * 60 * 1000,   // 30 min in-memory retention
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

// Wipe both in-memory and IndexedDB caches immediately on logout or account switch.
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
  window.addEventListener("kanthast-session", syncAuthCache);
  window.addEventListener("storage", (e) => {
    if (!e.key || e.key === TOKEN_KEY) syncAuthCache();
  });
}

export async function fetchPracticeStudioData() {
  const [mh, ms, fh, fs, vh, vs] = await Promise.all([
    getMcqHistory().catch(() => ({ sessions: [] })),
    getMcqStats().catch(() => ({ stats: [] })),
    getFlashcardHistory().catch(() => ({ history: [] })),
    getFlashcardStats().catch(() => null),
    getVivaHistory().catch(() => ({ sessions: [] })),
    getVivaStats().catch(() => null),
  ]);
  return {
    mcqHistory: mh.sessions || [],
    mcqStats: ms.stats || [],
    flashcardHistory: fh.history || [],
    flashcardStats: fs && fs.success ? fs : null,
    vivaHistory: vh.sessions || [],
    vivaStats: vs && vs.success ? vs : null,
  };
}

export function prefetchRouteData(path) {
  const token = currentToken();
  if (!token) return;

  if (path === "/dashboard" || path === "/library") {
    queryClient.prefetchQuery({
      queryKey: ["profile", token],
      queryFn: () => getProfile(token),
      staleTime: 2 * 60 * 1000,
    });
  } else if (path === "/practice") {
    queryClient.prefetchQuery({
      queryKey: ["practiceStudio", token],
      queryFn: fetchPracticeStudioData,
      staleTime: 60 * 1000,
    });
  }
}
