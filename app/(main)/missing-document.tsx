import {
  AppButton,
  AppText,
  Card,
  Chip,
  IconBadge,
  InfoRow,
  ScreenHeader,
  TextField,
} from "@/components/design";
import { documentIcon } from "@/components/document-card";
import { MISSING_STATE } from "@/components/missing-document-card";
import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MISSING_DOCUMENTS_QUERY_KEY } from "@/hooks/use-missing-documents";
import { FileTooLargeError } from "@/utils/compress-file";
import { formatMediumDate } from "@/utils/date-time";
import {
  pickDocument,
  pickImageFromCamera,
  pickImageFromLibrary,
  PermissionDeniedError,
} from "@/utils/file-pickers";
import { error } from "@/utils/logger";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Alert, Linking, Modal, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DocumentsQueryError,
  type MissingDocument,
  startRequiredDocumentUpload,
} from "../../api-queries/documents";
import { DocumentPreviewModal } from "../../components/document-preview-modal";

type PickedFile = { uri: string; name: string; mimeType?: string };

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)];
  return parts.filter(Boolean).join("-");
}

function isValidFutureIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return parsed > todayUtc;
}

/**
 * Upload a document from the Documents tab's Missing section — missing,
 * rejected, expired or expiring. The backend files it under the right
 * profession (backend docs/mobile-missing-documents.md).
 */
export default function MissingDocumentScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const document = useMemo<MissingDocument | null>(() => {
    try {
      return doc ? (JSON.parse(doc) as MissingDocument) : null;
    } catch {
      return null;
    }
  }, [doc]);

  const { colors } = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [pendingFile, setPendingFile] = useState<PickedFile | null>(null);
  const [expiryDraft, setExpiryDraft] = useState("");
  const [expiryError, setExpiryError] = useState<string | null>(null);
  const [confirmFile, setConfirmFile] = useState<PickedFile | null>(null);
  const [confirmExpiry, setConfirmExpiry] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const cancelUploadRef = useRef<(() => Promise<void>) | null>(null);
  const isPickingRef = useRef(false);

  const goBack = () => router.canGoBack() && router.back();

  if (!document) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Upload document" onBack={goBack} />
        <View style={styles.content}>
          <AppText color="textSecondary">This document couldn&apos;t be opened. Go back and try again.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const state = MISSING_STATE[document.state];
  const needsExpiry = document.expiry_date_mandatory === "yes";

  const chooseSource = () => {
    if (isPickingRef.current || isUploading) return;
    Alert.alert("Upload document", undefined, [
      { text: "Take Photo", onPress: () => pickAndStage(pickImageFromCamera) },
      { text: "Choose Photo", onPress: () => pickAndStage(pickImageFromLibrary) },
      { text: "Choose File", onPress: () => pickAndStage(pickDocument) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickAndStage = async (
    pick: () =>
      | ReturnType<typeof pickDocument>
      | ReturnType<typeof pickImageFromCamera>
      | ReturnType<typeof pickImageFromLibrary>,
  ) => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    try {
      const picked = await pick();
      if (!picked) return;

      // pickDocument() assets have a real file name; camera/library ones don't.
      const file: PickedFile = {
        uri: picked.uri,
        name: "name" in picked ? picked.name : `document.${picked.mimeType?.split("/")[1] ?? "jpg"}`,
        mimeType: picked.mimeType,
      };

      if (needsExpiry) {
        setPendingFile(file);
        setExpiryDraft("");
        setExpiryError(null);
        return;
      }
      setConfirmFile(file);
      setConfirmExpiry(undefined);
    } catch (err) {
      error("Missing document picker failed:", err);
      if (err instanceof PermissionDeniedError) {
        Alert.alert("Permission needed", err.message, [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      Alert.alert(
        "Error",
        err instanceof FileTooLargeError ? err.message : "Could not open the picker. Please try again.",
      );
    } finally {
      isPickingRef.current = false;
    }
  };

  const confirmExpiryDate = () => {
    if (!pendingFile) return;
    if (!isValidFutureIsoDate(expiryDraft)) {
      setExpiryError("Enter a valid future date as YYYY-MM-DD.");
      return;
    }
    setConfirmFile(pendingFile);
    setConfirmExpiry(expiryDraft);
    setPendingFile(null);
  };

  const refreshDocumentLists = () =>
    Promise.all(
      [
        MISSING_DOCUMENTS_QUERY_KEY,
        ["general-documents"],
        ["profession-documents"],
        ["duty-statement-documents"],
        ["hcp-status-sync"],
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
    );

  const upload = async () => {
    if (!confirmFile) return;
    const file = confirmFile;
    const expiryDate = confirmExpiry;

    setConfirmFile(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { completion, cancel } = await startRequiredDocumentUpload(
        { document_id: document.document_id, file, expiry_date: expiryDate },
        (progress) => setUploadProgress(progress.percent),
      );
      cancelUploadRef.current = cancel;

      completion
        .then(async () => {
          await refreshDocumentLists();
          Alert.alert("Document submitted", "Thanks — it's been sent for review.", [
            { text: "OK", onPress: goBack },
          ]);
        })
        .catch((err) => {
          Alert.alert(
            "Upload failed",
            err instanceof DocumentsQueryError ? err.message : "Could not upload this document right now.",
          );
        })
        .finally(() => {
          cancelUploadRef.current = null;
          setIsUploading(false);
          setUploadProgress(null);
        });
    } catch (err) {
      cancelUploadRef.current = null;
      setIsUploading(false);
      setUploadProgress(null);
      Alert.alert(
        "Upload failed",
        err instanceof DocumentsQueryError ? err.message : "Could not start the upload.",
      );
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={document.name} onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card radius={Radius.xl} padding={Space.lg} raised style={styles.summary}>
          <IconBadge icon={documentIcon(document.name)} tone={state.tone} size={56} />
          <AppText variant="title3" align="center">
            {document.name}
          </AppText>
          <AppText variant="callout" color="textSecondary" align="center">
            {document.message}
          </AppText>
          <View style={styles.chipRow}>
            <Chip label={state.label} tone={state.tone} icon={state.icon} />
            {needsExpiry && <Chip label="Expiry required" />}
          </View>
        </Card>

        {isUploading && (
          <Card radius={Radius.lg} padding={Space.md} style={styles.uploadCard}>
            <View style={styles.uploadHeader}>
              <AppText variant="subhead" style={styles.flex}>
                Uploading{uploadProgress != null ? ` — ${uploadProgress}%` : "…"}
              </AppText>
              <AppButton
                title="Cancel"
                variant="danger"
                size="compact"
                onPress={() => void cancelUploadRef.current?.()}
              />
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
              <View
                style={[styles.progressFill, { width: `${uploadProgress ?? 8}%`, backgroundColor: colors.primary }]}
              />
            </View>
          </Card>
        )}

        <AppButton
          title={document.state === "missing" ? "Upload document" : "Upload new copy"}
          icon="cloud-upload-outline"
          onPress={chooseSource}
          disabled={isUploading}
        />

        <AppText variant="overline" color="textTertiary" style={styles.sectionLabel}>
          Details
        </AppText>
        <Card radius={Radius.xl} padding={Space.md} style={styles.infoCard}>
          <InfoRow label="Type" value={document.type === "profession" ? "Professional" : "General"} />
          {document.required_by.length > 0 && (
            <InfoRow label="Needed for" value={document.required_by.join(", ")} />
          )}
          {document.expiry_date && (
            <InfoRow
              label="Current copy expires"
              value={formatMediumDate(document.expiry_date)}
              valueColor={document.state === "expired" ? "danger" : "text"}
            />
          )}
          <InfoRow label="Expiry date" value={needsExpiry ? "Required" : "Not needed"} isLast />
        </Card>
      </ScrollView>

      <Modal visible={!!pendingFile} transparent animationType="fade" onRequestClose={() => setPendingFile(null)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
            <IconBadge icon="calendar-outline" tone="primary" size={56} />
            <AppText variant="title3" align="center">
              Expiry date required
            </AppText>
            <AppText variant="callout" color="textSecondary" align="center">
              Enter the expiry date shown on this document.
            </AppText>
            <TextField
              value={expiryDraft}
              onChangeText={(value) => {
                setExpiryDraft(formatDateInput(value));
                setExpiryError(null);
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="number-pad"
              maxLength={10}
              icon="calendar-outline"
              error={expiryError}
              containerStyle={styles.dialogField}
            />
            <View style={styles.actions}>
              <AppButton title="Cancel" variant="outline" onPress={() => setPendingFile(null)} style={styles.flex} />
              <AppButton title="Next" onPress={confirmExpiryDate} style={styles.flex} />
            </View>
          </View>
        </View>
      </Modal>

      <DocumentPreviewModal
        visible={!!confirmFile}
        title="Confirm file"
        file={confirmFile}
        onClose={() => setConfirmFile(null)}
        actions={[
          {
            key: "confirm",
            label: "Confirm & upload",
            icon: "cloud-upload-outline",
            onPress: () => void upload(),
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: 80,
    gap: Space.md,
  },
  summary: { alignItems: "center", gap: Space.xs },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Space.xs,
    marginTop: Space.xs,
  },
  uploadCard: { gap: Space.sm },
  uploadHeader: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  progressTrack: { height: 8, borderRadius: Radius.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: Radius.full },
  actions: { flexDirection: "row", gap: Space.sm },
  sectionLabel: { marginTop: Space.xs, marginBottom: -Space.xs, paddingHorizontal: Space.xxs },
  infoCard: { paddingVertical: Space.xxs },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: Space.gutter },
  dialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.xxl,
    padding: Space.xl,
    alignItems: "center",
    gap: Space.sm,
  },
  dialogField: { alignSelf: "stretch", marginVertical: Space.xs },
});
