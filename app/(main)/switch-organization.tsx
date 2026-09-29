import {
  resolveTenantsByEmail,
  TenancyQueryError,
} from "@/api-queries/tenancy";
import {
  AppButton,
  AppText,
  EmptyState,
  ScreenHeader,
} from "@/components/design";
import { OrganizationPicker } from "@/components/organization-picker";
import { Space } from "@/constants/design";
import { useProfileData } from "@/data-store/use-account-store";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { TenantSummary } from "@/data-types/tenancy";
import { useAppTheme } from "@/hooks/use-app-theme";
import { stopBackgroundTracking } from "@/task-services/locationTask";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SwitchOrganization() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const profileStore = useProfileData();

  const currentTenant = useTenantStore((state) => state.tenant);

  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(
    currentTenant?.tenantId ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTenant?.email) {
      setIsLoading(false);
      setError("We couldn't tell which email to look up organizations for.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    resolveTenantsByEmail(currentTenant.email)
      .then((matches) => {
        if (cancelled) return;
        setTenants(matches);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof TenancyQueryError
            ? err.message
            : "Could not load your organizations. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentTenant?.email]);

  const hasOtherOrganizations = tenants.length > 1;
  const selectionUnchanged = selectedTenantId === currentTenant?.tenantId;

  const handleSwitch = async () => {
    const chosen = tenants.find((t) => t.tenantId === selectedTenantId);
    if (!chosen || !currentTenant?.email || selectionUnchanged) return;

    await stopBackgroundTracking();
    profileStore.clearDetails();
    queryClient.clear();
    useTenantStore.getState().setTenant(chosen, currentTenant.email);
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Switch organization" onBack={() => router.back()} />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <EmptyState icon="alert-circle-outline" tone="danger" title="Couldn't load organizations" message={error} />
        </View>
      ) : !hasOtherOrganizations ? (
        <View style={styles.centered}>
          <EmptyState
            icon="business-outline"
            title="Just one organization"
            message="You don't have access to any other organizations yet."
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="callout" color="textSecondary">
            Choose which organization to switch to.
          </AppText>

          <OrganizationPicker
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={(tenant) => setSelectedTenantId(tenant.tenantId)}
          />

          {!selectionUnchanged && (
            <AppButton
              title="Switch organization"
              icon="swap-horizontal"
              onPress={handleSwitch}
              fullWidth
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: Space.xxl,
    gap: Space.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
