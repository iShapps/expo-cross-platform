import {
  AppButton,
  AppText,
  Card,
  Chip,
  EmptyState,
  IconBadge,
  InfoRow,
  ScreenHeader,
  TextField,
} from "@/components/design";
import { documentIcon } from "@/components/document-card";
import { Radius, Space, type Tone } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { FileTooLargeError } from "@/utils/compress-file";
import { formatMediumDate, isExpired } from "@/utils/date-time";
import { pickDocument } from "@/utils/file-pickers";
import { error } from "@/utils/logger";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DocumentsQueryError,
  getDocumentFileUrl,
  getDutyStatementDocuments,
  getGenaralStatementDocuments,
  getProfessionDocuments,
  startBackgroundDocumentUpload,
} from "../../api-queries/documents";
import {
  DocumentPreviewModal,
  PreviewFile,
} from "../../components/document-preview-modal";
import { IDocument } from "../../data-types/documents";

function extensionToMimeType(ext?: string): string | undefined {
  switch ((ext ?? "").toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    default:
      return undefined;
  }
}

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
  const todayUtc = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  return parsed >= todayUtc;
}

const DocumentDetails = () => {
  const { id, doc } = useLocalSearchParams<{ id: string; doc?: string }>();
  const [document, setDocument] = useState<IDocument | null>(null);

  const [loading, setLoading] = useState(true);

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const [pendingFile, setPendingFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
  } | null>(null);
  const [expiryDraft, setExpiryDraft] = useState("");
  const [expiryError, setExpiryError] = useState<string | null>(null);

  // Confirmation step shown before a picked replacement is actually uploaded.
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmFile, setConfirmFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
  } | null>(null);
  const [confirmExpiry, setConfirmExpiry] = useState<string | undefined>(
    undefined,
  );

  // Background upload started after confirmation — tracked so the screen
  // stays interactive (no blocking spinner) while it finishes.
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const cancelUploadRef = useRef<(() => Promise<void>) | null>(null);
  const isPickingDocumentRef = useRef(false);

  const { colors } = useAppTheme();

  const router = useRouter();
  useEffect(() => {
    if (doc) {
      try {
        const parsed = typeof doc === "string" ? JSON.parse(doc) : doc;
        setDocument(parsed as IDocument);
      } catch (e) {
        console.warn("Failed to parse doc param", e);
      }
    }
  }, [doc]);

  useEffect(() => {
    if (doc) {
      const parsed = JSON.parse(doc);
      setDocument(parsed);
      setLoading(false);
      return;
    }
    async function fetchDocument() {
      setLoading(true);
      // Try all document types (General, Professional, Others)
      let found: IDocument | null = null;
      const queries = [
        getGenaralStatementDocuments,
        getDutyStatementDocuments,
        getProfessionDocuments,
      ];
      for (const query of queries) {
        try {
          const res = await query(1);
          const doc = res.data.hcps.data.find(
            (d: IDocument) => d.id === Number(id),
          );
          if (doc) {
            found = doc;
            break;
          }
        } catch {}
      }
      setDocument(found);
      setLoading(false);
    }
    if (id) fetchDocument();
  }, [id, doc]);

  const handlePreview = async () => {
    if (!document) return;

    setIsPreviewLoading(true);
    try {
      const res = await getDocumentFileUrl(document.hcp_id, document.id);
      setPreviewFile({
        uri: res.data.url,
        name: res.data.filename,
        mimeType: extensionToMimeType(res.data.type),
      });
      setPreviewVisible(true);
    } catch (err) {
      Alert.alert(
        "Preview unavailable",
        err instanceof DocumentsQueryError
          ? err.message
          : "Could not load this document right now.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const openConfirm = (
    file: { uri: string; name: string; mimeType?: string },
    expiryDate?: string,
  ) => {
    setConfirmFile(file);
    setConfirmExpiry(expiryDate);
    setConfirmVisible(true);
  };

  const handleReplace = async () => {
    if (!document || isPickingDocumentRef.current) return;

    isPickingDocumentRef.current = true;
    try {
      const picked = await pickDocument();
      if (!picked) return;

      const file = {
        uri: picked.uri,
        name: picked.name,
        mimeType: picked.mimeType,
      };

      if (document.document.expiry_date_mandatory === "yes") {
        setPendingFile(file);
        setExpiryDraft("");
        setExpiryError(null);
        return;
      }

      openConfirm(file);
    } catch (err) {
      error("Re-upload document picker failed:", err);
      Alert.alert(
        "Error",
        err instanceof FileTooLargeError
          ? err.message
          : "Could not open the file picker. Please try again.",
      );
    } finally {
      isPickingDocumentRef.current = false;
    }
  };

  const confirmReplacementWithExpiry = () => {
    if (!pendingFile) return;

    if (!isValidFutureIsoDate(expiryDraft)) {
      setExpiryError("Enter a valid future date as YYYY-MM-DD.");
      return;
    }

    openConfirm(pendingFile, expiryDraft);
    setPendingFile(null);
  };

  // Kicks off the upload as a native background task and returns immediately —
  // the screen stays fully interactive while it finishes, instead of blocking
  // on a big multipart request. Progress + completion are reflected via state.
  const handleConfirmedUpload = async () => {
    if (!document || !confirmFile) return;

    const file = confirmFile;
    const expiryDate = confirmExpiry;

    setConfirmVisible(false);
    setConfirmFile(null);
    setPreviewVisible(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { completion, cancel } = await startBackgroundDocumentUpload(
        {
          hcp_id: document.hcp_id,
          document_id: document.document_id,
          file,
          expiry_date: expiryDate,
        },
        (progress) => setUploadProgress(progress.percent),
      );
      cancelUploadRef.current = cancel;

      completion
        .then(() => {
          setDocument((prev) =>
            prev
              ? {
                  ...prev,
                  document_name: file.name,
                  document_approval: "pending",
                  expiry_date: expiryDate ?? prev.expiry_date,
                }
              : prev,
          );
          Alert.alert(
            "Document updated",
            "Your new file has been submitted and is pending review.",
          );
        })
        .catch((err) => {
          Alert.alert(
            "Update failed",
            err instanceof DocumentsQueryError
              ? err.message
              : "Could not update this document right now.",
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
        "Update failed",
        err instanceof DocumentsQueryError
          ? err.message
          : "Could not start the upload.",
      );
    }
  };

  const handleCancelUpload = async () => {
    await cancelUploadRef.current?.();
  };

  const goBack = () => router.canGoBack() && router.back();

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Document" onBack={goBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="callout" color="textSecondary">
            Loading document…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }
  if (!document) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Document details" onBack={goBack} />
        <View style={styles.centered}>
          <EmptyState
            icon="alert-circle-outline"
            tone="danger"
            title="Document not found."
            message="It may have been removed or replaced."
            actionLabel="Go back"
            onAction={goBack}
          />
        </View>
      </SafeAreaView>
    );
  }

  const expired = isExpired(document.expiry_date);
  const isActive = document.document.status === "active";
  const statusLabel = expired ? "Expired" : isActive ? "Active" : "Inactive";
  const statusTone: Tone = expired || !isActive ? "danger" : "success";
  const approval = document.document_approval ?? "";
  const approvalLabel = approval
    ? approval.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
  const approvalTone: Tone =
    approval === "approved" || approval === "reapproved"
      ? "success"
      : approval.startsWith("pending")
        ? "warning"
        : "danger";
  const capitalize = (value?: string | null) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={document.document.name} onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <Card
          radius={Radius.xl}
          padding={Space.lg}
          raised
          style={[
            styles.summary,
            expired && { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
          ]}
        >
          <IconBadge
            icon={documentIcon(document.document.name)}
            tone={expired ? "danger" : approvalTone === "warning" ? "warning" : "primary"}
            size={56}
          />
          <AppText variant="title3" color={expired ? "danger" : "text"}>
            {document.document.name}
          </AppText>
          <AppText variant="footnote" color="textSecondary" numberOfLines={1}>
            {document.document_name}
          </AppText>
          <View style={styles.chipRow}>
            <Chip label={statusLabel} tone={statusTone} />
            <Chip label={approvalLabel} tone={approvalTone} />
          </View>
        </Card>

        {isUploading && (
          <Card radius={Radius.lg} padding={Space.md} style={styles.uploadCard}>
            <View style={styles.uploadHeader}>
              <AppText variant="subhead" style={styles.flex}>
                Uploading new file
                {uploadProgress != null ? ` — ${uploadProgress}%` : "…"}
              </AppText>
              <AppButton
                title="Cancel"
                variant="danger"
                size="compact"
                onPress={handleCancelUpload}
              />
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${uploadProgress ?? 8}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Preview"
            variant="outline"
            icon="eye-outline"
            onPress={handlePreview}
            loading={isPreviewLoading}
            disabled={isPreviewLoading || isUploading}
            style={styles.flex}
          />
          <AppButton
            title="Re-upload"
            icon="cloud-upload-outline"
            onPress={handleReplace}
            disabled={isUploading}
            style={styles.flex}
          />
        </View>

        {/* Details */}
        <AppText variant="overline" color="textTertiary" style={styles.sectionLabel}>
          Document info
        </AppText>
        <Card radius={Radius.xl} padding={Space.md} style={styles.infoCard}>
          <InfoRow label="Name" value={document.document.name} />
          <InfoRow label="File" value={document.document_name} />
          {document.document.expiry_date_mandatory === "yes" && (
            <InfoRow
              label="Expiry date"
              value={formatMediumDate(document.expiry_date)}
              valueColor={expired ? "danger" : "text"}
            />
          )}
          <InfoRow
            label="Approval status"
            value={approvalLabel}
            valueColor={approval === "approved" ? "primaryStrong" : "danger"}
          />
          <InfoRow label="Type" value={capitalize(document.document.doc_type)} />
          <InfoRow label="Mandatory" value={capitalize(document.document.mandatory_status)} />
          <InfoRow
            label="Status"
            value={expired ? "Expired" : capitalize(document.document.status)}
            valueColor={expired ? "danger" : "text"}
            isLast
          />
        </Card>
      </ScrollView>

      <DocumentPreviewModal
        visible={previewVisible}
        title={document.document.name}
        file={previewFile}
        onClose={() => setPreviewVisible(false)}
        actions={[
          {
            key: "replace",
            label: "Re Upload",
            icon: "cloud-upload-outline",
            onPress: () => {
              setPreviewVisible(false);
              void handleReplace();
            },
            disabled: isUploading,
          },
        ]}
      />

      <Modal
        visible={!!pendingFile}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingFile(null)}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
            <IconBadge icon="calendar-outline" tone="primary" size={56} />
            <AppText variant="title3" align="center">
              Expiry date required
            </AppText>
            <AppText variant="callout" color="textSecondary" align="center">
              This document needs an expiry date to be submitted.
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
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setPendingFile(null)}
                style={styles.flex}
              />
              <AppButton
                title="Next"
                onPress={confirmReplacementWithExpiry}
                style={styles.flex}
              />
            </View>
          </View>
        </View>
      </Modal>

      <DocumentPreviewModal
        visible={confirmVisible}
        title="Confirm new file"
        file={confirmFile}
        onClose={() => {
          setConfirmVisible(false);
          setConfirmFile(null);
        }}
        actions={[
          {
            key: "confirm",
            label: "Confirm & upload",
            icon: "cloud-upload-outline",
            onPress: () => void handleConfirmedUpload(),
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Space.sm,
    padding: Space.gutter,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: 80,
    gap: Space.md,
  },
  summary: {
    alignItems: "center",
    gap: Space.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Space.xs,
    marginTop: Space.xs,
  },
  uploadCard: {
    gap: Space.sm,
  },
  uploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  actions: {
    flexDirection: "row",
    gap: Space.sm,
  },
  sectionLabel: {
    marginTop: Space.xs,
    marginBottom: -Space.xs,
    paddingHorizontal: Space.xxs,
  },
  infoCard: {
    paddingVertical: Space.xxs,
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Space.gutter,
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.xxl,
    padding: Space.xl,
    alignItems: "center",
    gap: Space.sm,
  },
  dialogField: {
    alignSelf: "stretch",
    marginVertical: Space.xs,
  },
});

export default DocumentDetails;
