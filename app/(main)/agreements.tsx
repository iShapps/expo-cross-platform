import type { AgreementSummary } from "@/api-queries/agreements";
import {
  AppText,
  Chip,
  EmptyState,
  Icon,
  IconBadge,
  PressableCard,
  ScreenHeader,
  SegmentedTabs,
} from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useAgreements } from "@/hooks/use-agreements";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMediumDate } from "@/utils/date-time";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Agreements (HR module): policies to read and sign, and what's been signed. */
export default function AgreementsScreen() {
  const { colors } = useAppTheme();
  const { toSign, signed, isLoading, isError, error, refetch, isRefetching } = useAgreements();
  const [tab, setTab] = useState(toSign.length === 0 && signed.length > 0 ? 1 : 0);
  const rows = tab === 0 ? toSign : signed;

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Agreements" onBack={() => router.back()} />

      <View style={styles.tabs}>
        <SegmentedTabs
          tabs={[`To sign${toSign.length ? ` (${toSign.length})` : ""}`, "Signed"]}
          activeIndex={tab}
          onTabPress={setTab}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: Space.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <AgreementRow item={item} />}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="alert-circle-outline"
                tone="danger"
                title="Couldn't load agreements"
                message={error instanceof Error ? error.message : undefined}
                actionLabel="Try again"
                onAction={() => refetch()}
              />
            ) : tab === 0 ? (
              <EmptyState icon="checkmark-done-outline" tone="success" title="Nothing to sign" message="When your agency sends you a policy to sign, it appears here." />
            ) : (
              <EmptyState icon="document-text-outline" title="Nothing signed yet" message="Agreements you sign are kept here, with your signed record." />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function AgreementRow({ item }: { item: AgreementSummary }) {
  const { colors } = useAppTheme();
  const signed = item.status === "signed";

  return (
    <PressableCard
      onPress={() => router.push({ pathname: "/(main)/agreement", params: { id: String(item.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${signed ? "signed" : "to sign"}`}
      radius={Radius.xl}
      padding={Space.md}
      style={styles.row}
    >
      <IconBadge icon={signed ? "checkmark-circle-outline" : "create-outline"} tone={signed ? "success" : "blue"} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{item.title}</AppText>
        <AppText variant="caption" color="textTertiary">{item.kind === "contract" ? "Contract" : "Policy"}</AppText>
        <AppText variant="footnote" color="textSecondary">
          {signed && item.signed_at
            ? `Signed ${formatMediumDate(item.signed_at)} · version ${item.version}`
            : `Sent ${item.sent_at ? formatMediumDate(item.sent_at) : ""} · version ${item.version}`}
        </AppText>
      </View>
      {!signed && <Chip label={item.status === "viewed" ? "Opened" : "New"} tone={item.status === "viewed" ? "info" : "warning"} />}
      <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  tabs: { paddingHorizontal: Space.gutter, paddingBottom: Space.sm },
  list: { paddingHorizontal: Space.gutter, paddingBottom: Space.xxl, gap: Space.sm, flexGrow: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: Space.sm },
});
