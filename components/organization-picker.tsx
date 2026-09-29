import { AppText, Icon, OrgLogo } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { TenantSummary } from "@/data-types/tenancy";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Pressable, StyleSheet, View } from "react-native";

export function OrganizationPicker({
  tenants,
  selectedTenantId,
  onSelect,
  disabled,
}: {
  tenants: TenantSummary[];
  selectedTenantId: string | null;
  onSelect: (tenant: TenantSummary) => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.orgList} accessibilityRole="radiogroup">
      {tenants.map((tenant) => {
        const isSelected = tenant.tenantId === selectedTenantId;
        return (
          <Pressable
            key={tenant.tenantId}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled: !!disabled }}
            style={({ pressed }) => [
              styles.orgRow,
              {
                backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => onSelect(tenant)}
            disabled={disabled}
          >
            <OrgLogo name={tenant.name} uri={tenant.logoUrl} size={44} />
            <AppText variant="headline" numberOfLines={2} style={styles.orgName}>
              {tenant.name ?? "Untitled organization"}
            </AppText>
            <Icon
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isSelected ? colors.primaryStrong : colors.borderStrong}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  orgList: {
    gap: Space.sm,
  },
  orgRow: {
    minHeight: 72,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  orgName: {
    flex: 1,
  },
});
