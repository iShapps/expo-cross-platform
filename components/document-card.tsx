import { AppText, Chip, Icon, IconBadge, PressableCard, type IconName } from "@/components/design";
import { Radius, Space, type Tone } from "@/constants/design";
import { IDocument } from "@/data-types/documents";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMediumDate, isExpired } from "@/utils/date-time";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

interface DocumentCardProps {
  document: IDocument;
}

const PENDING_APPROVAL_STATUSES = ["pending", "pending-reapproval"];

/** Icon for a document, picked from its name (same rules as before, Ionicons only). */
export function documentIcon(name: string): IconName {
  const docName = name.toLowerCase();
  if (docName.includes("ain qualification")) return "id-card-outline";
  if (docName.includes("other qualification")) return "ribbon-outline";
  if (docName.includes("working with children")) return "people-outline";
  if (docName.includes("manual handling")) return "accessibility-outline";
  if (docName.includes("passport") || docName.includes("medicare")) return "card-outline";
  if (docName.includes("police clearance")) return "shield-checkmark-outline";
  if (docName.includes("drivers license")) return "car-outline";
  if (docName.includes("influenza vaccine")) return "medkit-outline";
  return "document-text-outline";
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const expired = isExpired(document.expiry_date);
  const pendingApproval = PENDING_APPROVAL_STATUSES.includes(
    document.document_approval,
  );
  const { colors } = useAppTheme();
  const router = useRouter();

  const tone: Tone = expired ? "danger" : pendingApproval ? "warning" : "primary";
  const isActive = document.document.status === "active";

  return (
    <PressableCard
      onPress={() => {
        router.push({
          pathname: "/(main)/document-details",
          params: { id: document.id, doc: JSON.stringify(document) },
        });
      }}
      hitSlop={8}
      accessibilityRole="button"
      radius={Radius.lg}
      padding={Space.md}
      style={[
        styles.card,
        expired && { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
      ]}
    >
      <View>
        <IconBadge icon={documentIcon(document.document.name)} tone={tone} size={48} />
        <View
          accessibilityLabel={isActive ? "Active" : "Inactive"}
          style={[
            styles.statusDot,
            {
              backgroundColor: isActive ? colors.primary : colors.danger,
              borderColor: expired ? colors.dangerSoft : colors.surface,
            },
          ]}
        />
      </View>

      <View style={styles.infoColumn}>
        <AppText variant="headline" color={expired ? "danger" : "text"} numberOfLines={2}>
          {document.document.name}
        </AppText>
        <AppText variant="footnote" color={expired ? "danger" : "textSecondary"}>
          {expired
            ? `Expired on ${formatMediumDate(document.expiry_date)}`
            : `Uploaded on ${formatMediumDate(document.created_at)}`}
        </AppText>
        <View style={styles.chipRow}>
          {expired ? (
            <Chip label="Expired" tone="danger" icon="alert-circle-outline" />
          ) : pendingApproval ? (
            <Chip label="Pending approval" tone="warning" icon="hourglass-outline" />
          ) : null}
          <Chip
            label={document.document.mandatory_status === "yes" ? "Mandatory" : "Optional"}
          />
          <Chip
            label={
              document.document.expiry_date_mandatory === "yes"
                ? "Expiry required"
                : "No expiry"
            }
          />
        </View>
      </View>

      <Icon
        name="chevron-forward"
        size={18}
        color={expired ? colors.danger : colors.textTertiary}
        style={styles.chevron}
      />
    </PressableCard>
  );
};

export default DocumentCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.sm,
  },
  statusDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    borderWidth: 2,
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
