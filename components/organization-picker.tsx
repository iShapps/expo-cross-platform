import { Colors, Radii } from "@/constants/theme";
import { TenantSummary } from "@/data-types/tenancy";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function getOrgInitials(name: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

export function OrganizationPicker({
  tenants,
  selectedTenantId,
  onSelect,
  disabled,
  theme,
}: {
  tenants: TenantSummary[];
  selectedTenantId: string | null;
  onSelect: (tenant: TenantSummary) => void;
  disabled?: boolean;
  theme: typeof Colors.light;
}) {
  const styles = getStyles(theme);

  return (
    <View style={styles.orgList}>
      {tenants.map((tenant) => {
        const isSelected = tenant.tenantId === selectedTenantId;
        return (
          <TouchableOpacity
            key={tenant.tenantId}
            style={[
              styles.orgRow,
              isSelected && {
                borderColor: theme.primary,
                backgroundColor: theme.heroBg,
              },
            ]}
            onPress={() => onSelect(tenant)}
            disabled={disabled}
          >
            {tenant.logoUrl ? (
              <Image
                source={{ uri: tenant.logoUrl }}
                style={styles.orgLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.orgLogoFallback}>
                <Text style={styles.orgLogoFallbackText}>
                  {getOrgInitials(tenant.name)}
                </Text>
              </View>
            )}
            <Text style={styles.orgName} numberOfLines={1}>
              {tenant.name ?? "Untitled organization"}
            </Text>
            {isSelected ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={theme.primary}
              />
            ) : (
              <Ionicons
                name="ellipse-outline"
                size={22}
                color={theme.greyBorder}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    orgList: {
      gap: 10,
    },
    orgRow: {
      borderWidth: 1,
      borderColor: theme.greyBorder,
      borderRadius: Radii.sm,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    orgLogo: {
      width: 36,
      height: 36,
      borderRadius: Radii.xs,
    },
    orgLogoFallback: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    orgLogoFallbackText: {
      color: theme.white,
      fontSize: 13,
      fontWeight: "700",
    },
    orgName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: theme.primaryText,
    },
  });
