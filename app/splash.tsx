import { resolveTenantsByEmail } from "@/api-queries/tenancy";
import { TenantResolvingSplash } from "@/components/tenant-resolving-splash";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { debug, error as logError } from "@/utils/logger";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useSession } from "./ctx";

export function SplashScreenController({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: sessionLoading } = useSession();
  const tenant = useTenantStore((state) => state.tenant);
  const tenantHasHydrated = useTenantStore((state) => state.hasHydrated);

  const [tenantRefreshSettled, setTenantRefreshSettled] = useState(false);
  const refreshStartedRef = useRef(false);

  useEffect(() => {
    if (!tenantHasHydrated) return;

    if (!tenant) {
      setTenantRefreshSettled(true);
      return;
    }

    if (!tenant.email) {
      logError("[TenantRefresh] Persisted tenant missing email; clearing it");
      useTenantStore.getState().clearTenant();
      setTenantRefreshSettled(true);
      return;
    }

    if (refreshStartedRef.current) return;
    refreshStartedRef.current = true;

    resolveTenantsByEmail(tenant.email)
      .then((tenants) => {
        const fresh = tenants.find((t) => t.tenantId === tenant.tenantId);
        if (fresh) {
          useTenantStore.getState().setTenant(fresh, tenant.email);
          debug("[TenantRefresh] Refreshed tenant details on launch");
        } else {
          logError(
            "[TenantRefresh] Cached tenant not found in refreshed list; keeping cached details",
          );
        }
      })
      .catch((err) => {
        logError("[TenantRefresh] Failed, using cached tenant details:", err);
      })
      .finally(() => setTenantRefreshSettled(true));
  }, [tenantHasHydrated, tenant]);

  const showTenantSplash =
    tenantHasHydrated && !!tenant && !tenantRefreshSettled;

  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    if (tenantHasHydrated && tenantRefreshSettled && !sessionLoading) {
      setAppReady(true);
    }
  }, [tenantHasHydrated, tenantRefreshSettled, sessionLoading]);

  const onLayout = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!tenantHasHydrated) return null;

  if (showTenantSplash) return <TenantResolvingSplash />;

  if (!appReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
}
