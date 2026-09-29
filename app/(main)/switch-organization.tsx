import {
  resolveTenantsByEmail,
  TenancyQueryError,
} from "@/api-queries/tenancy";
import Header from "@/components/Header";
import { OrganizationPicker } from "@/components/organization-picker";
import { Colors, Radii } from "@/constants/theme";
import { useProfileData } from "@/data-store/use-account-store";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { TenantSummary } from "@/data-types/tenancy";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { stopBackgroundTracking } from "@/task-services/locationTask";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SwitchOrganization() {
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
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
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <Header title="Switch Organization" onBack={() => router.back()} />

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={theme.secondaryText}
            />
            <Text style={styles.messageText}>{error}</Text>
          </View>
        ) : !hasOtherOrganizations ? (
          <View style={styles.centered}>
            <Ionicons
              name="business-outline"
              size={40}
              color={theme.secondaryText}
            />
            <Text style={styles.messageText}>
              You don&apos;t have access to any other organizations yet.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Choose which organization to switch to.
            </Text>

            <OrganizationPicker
              tenants={tenants}
              selectedTenantId={selectedTenantId}
              onSelect={(tenant) => setSelectedTenantId(tenant.tenantId)}
              theme={theme}
            />

            {!selectionUnchanged && (
              <TouchableOpacity style={styles.button} onPress={handleSwitch}>
                <Text style={styles.buttonText}>Switch Organization</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
      padding: 20,
      gap: 16,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 24,
    },
    messageText: {
      fontSize: 14,
      color: theme.secondaryText,
      textAlign: "center",
      lineHeight: 20,
    },
    subtitle: {
      fontSize: 13,
      color: theme.secondaryText,
      lineHeight: 19,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: Radii.sm,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    buttonText: {
      color: theme.white,
      fontSize: 15,
      fontWeight: "700",
    },
  });
