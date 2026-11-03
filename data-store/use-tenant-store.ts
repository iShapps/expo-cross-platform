import { PersistedTenant, TenantSummary } from "@/data-types/tenancy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

const hasRealStorageEnvironment =
  (typeof navigator !== "undefined" && navigator.product === "ReactNative") ||
  (typeof window !== "undefined" && typeof window.document !== "undefined");

const noopStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export type CachedSessionSummary = {
  name: string | null;
  logoUrl: string | null;
  email: string;
  lastActiveAt: number;
};

interface TenantStoreType {
  tenant: PersistedTenant | null;
  hasHydrated: boolean;
  // Presence of a tenantId key here means this device has a working cached
  // login for that tenant (an archived token/user in SecureStore — see
  // utils/tenant-session-archive.ts) — not just that the email resolves to
  // it. Lets the switcher distinguish "switch instantly" from "needs login".
  cachedSessions: Record<string, CachedSessionSummary>;
  setTenant: (tenant: TenantSummary, email: string) => void;
  clearTenant: () => void;
  markSessionCached: (
    tenantId: string,
    summary: Omit<CachedSessionSummary, "lastActiveAt">,
  ) => void;
  removeCachedSession: (tenantId: string) => void;
  hasCachedSession: (tenantId: string) => boolean;
}

function isValidPersistedTenant(value: unknown): value is PersistedTenant {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tenantId === "string" &&
    v.tenantId.length > 0 &&
    typeof v.email === "string" &&
    v.email.length > 0
  );
}

export const useTenantStore = create<TenantStoreType>()(
  persist(
    (set, get) => ({
      tenant: null,
      hasHydrated: false,
      cachedSessions: {},
      setTenant: (tenant, email) =>
        set({ tenant: { ...tenant, email, resolvedAt: Date.now() } }),
      clearTenant: () => set({ tenant: null }),
      markSessionCached: (tenantId, summary) =>
        set((state) => ({
          cachedSessions: {
            ...state.cachedSessions,
            [tenantId]: { ...summary, lastActiveAt: Date.now() },
          },
        })),
      removeCachedSession: (tenantId) =>
        set((state) => {
          const { [tenantId]: _removed, ...rest } = state.cachedSessions;
          return { cachedSessions: rest };
        }),
      hasCachedSession: (tenantId) => !!get().cachedSessions[tenantId],
    }),
    {
      name: "ishapps-tenant-data",
      storage: createJSONStorage(() =>
        hasRealStorageEnvironment ? AsyncStorage : noopStorage,
      ),
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as
          | { tenant?: unknown; cachedSessions?: unknown }
          | undefined;
        const cachedSessions =
          state?.cachedSessions && typeof state.cachedSessions === "object"
            ? (state.cachedSessions as Record<string, CachedSessionSummary>)
            : {};
        return {
          tenant: isValidPersistedTenant(state?.tenant) ? state?.tenant : null,
          cachedSessions,
        };
      },
      partialize: (state) => ({
        tenant: state.tenant,
        cachedSessions: state.cachedSessions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tenant && !isValidPersistedTenant(state.tenant)) {
          useTenantStore.setState({ tenant: null });
        }
        if (!state?.cachedSessions) {
          useTenantStore.setState({ cachedSessions: {} });
        }
        useTenantStore.setState({ hasHydrated: true });
      },
    },
  ),
);
