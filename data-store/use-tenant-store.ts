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

interface TenantStoreType {
  tenant: PersistedTenant | null;
  hasHydrated: boolean;
  setTenant: (tenant: TenantSummary, email: string) => void;
  clearTenant: () => void;
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
    (set) => ({
      tenant: null,
      hasHydrated: false,
      setTenant: (tenant, email) =>
        set({ tenant: { ...tenant, email, resolvedAt: Date.now() } }),
      clearTenant: () => set({ tenant: null }),
    }),
    {
      name: "ishapps-tenant-data",
      storage: createJSONStorage(() =>
        hasRealStorageEnvironment ? AsyncStorage : noopStorage,
      ),
      version: 1,
      migrate: (persistedState) => {
        const tenant = (persistedState as { tenant?: unknown } | undefined)
          ?.tenant;
        return { tenant: isValidPersistedTenant(tenant) ? tenant : null };
      },
      partialize: (state) => ({ tenant: state.tenant }),
      onRehydrateStorage: () => (state) => {
        if (state?.tenant && !isValidPersistedTenant(state.tenant)) {
          useTenantStore.setState({ tenant: null });
        }
        useTenantStore.setState({ hasHydrated: true });
      },
    },
  ),
);
