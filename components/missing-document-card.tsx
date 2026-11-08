import type { MissingDocument, MissingDocumentState } from "@/api-queries/documents";
import { AppText, Chip, Icon, IconBadge, PressableCard } from "@/components/design";
import { documentIcon } from "@/components/document-card";
import { Radius, Space, type Tone } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

type StateStyle = { label: string; tone: Tone; icon: React.ComponentProps<typeof Chip>["icon"] };

// Red is "blocks your shifts": missing, rejected and expired. Rejected/expired also fill the card
// (something they had stopped counting); missing keeps a plain card with a red chip.
export const MISSING_STATE: Record<MissingDocumentState, StateStyle> = {
  missing: { label: "Missing", tone: "danger", icon: "cloud-upload-outline" },
  rejected: { label: "Rejected", tone: "danger", icon: "close-circle-outline" },
  expired: { label: "Expired", tone: "danger", icon: "alert-circle-outline" },
  expiring: { label: "Expiring soon", tone: "amber", icon: "time-outline" },
};

/** An optional certification not uploaded yet: good to have, never required. */
export const OPTIONAL_STATE: StateStyle = { label: "Optional", tone: "warning", icon: "add-circle-outline" };

export const stateStyle = (document: MissingDocument): StateStyle =>
  document.optional ? OPTIONAL_STATE : MISSING_STATE[document.state];

/** One document the HCP has to (or, if optional, may) upload — opens the upload screen. */
export default function MissingDocumentCard({ document }: { document: MissingDocument }) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const state = stateStyle(document);
  const urgent = !document.optional && (document.state === "rejected" || document.state === "expired");

  return (
    <PressableCard
      onPress={() =>
        router.push({
          pathname: "/(main)/missing-document",
          params: { doc: JSON.stringify(document) },
        })
      }
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${document.name}: ${document.message}`}
      radius={Radius.lg}
      padding={Space.md}
      style={[styles.card, urgent && { borderColor: colors.danger, backgroundColor: colors.dangerSoft }]}
    >
      <IconBadge icon={documentIcon(document.name)} tone={state.tone} size={48} />

      <View style={styles.infoColumn}>
        <AppText variant="headline" color={urgent ? "danger" : "text"} numberOfLines={2}>
          {document.name}
        </AppText>
        <AppText variant="footnote" color={urgent ? "danger" : "textSecondary"}>
          {document.message}
        </AppText>
        <View style={styles.chipRow}>
          {/* General (everyone) or the professions that need it. */}
          <Chip
            label={
              document.type === "general"
                ? "General"
                : document.required_by.length > 0
                  ? document.required_by.join(", ")
                  : "Profession"
            }
            tone="blue"
          />
          <Chip label={state.label} tone={state.tone} icon={state.icon} />
          {document.expiry_date_mandatory === "yes" && <Chip label="Expiry required" />}
        </View>
      </View>

      <Icon
        name="chevron-forward"
        size={18}
        color={urgent ? colors.danger : colors.textTertiary}
        style={styles.chevron}
      />
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.sm,
  },
  infoColumn: {
    flex: 1,
    gap: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Space.xxs + 2,
    marginTop: Space.xs,
  },
  chevron: {
    alignSelf: "center",
  },
});
