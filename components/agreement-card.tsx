import type { AgreementSummary } from "@/api-queries/agreements";
import { AppText, Chip, Icon, IconBadge, PressableCard } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMediumDate } from "@/utils/date-time";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

/** One contract or policy (Documents → Contracts / Policies): opens it to read and sign. */
export default function AgreementCard({ item }: { item: AgreementSummary }) {
  const { colors } = useAppTheme();
  const signed = item.status === "signed";

  return (
    <PressableCard
      onPress={() => router.push({ pathname: "/(main)/agreement", params: { id: String(item.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${signed ? "signed" : "to sign"}`}
      radius={Radius.lg}
      padding={Space.md}
      style={styles.row}
    >
      <IconBadge icon={signed ? "checkmark-circle-outline" : "create-outline"} tone={signed ? "success" : "blue"} size={48} />
      <View style={styles.info}>
        <AppText variant="headline" numberOfLines={2}>{item.title}</AppText>
        <AppText variant="footnote" color="textSecondary">
          {signed && item.signed_at
            ? `Signed ${formatMediumDate(item.signed_at)} · version ${item.version}`
            : `Sent ${item.sent_at ? formatMediumDate(item.sent_at) : ""} · version ${item.version}`}
        </AppText>
        <View style={styles.chipRow}>
          {signed ? (
            <Chip label="Signed" tone="success" icon="checkmark-circle-outline" />
          ) : (
            <Chip
              label={item.status === "viewed" ? "Opened · to sign" : "To sign"}
              tone="warning"
              icon="create-outline"
            />
          )}
        </View>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textTertiary} style={styles.chevron} />
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: Space.sm },
  info: { flex: 1, gap: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Space.xxs + 2, marginTop: Space.xs },
  chevron: { alignSelf: "center" },
});
