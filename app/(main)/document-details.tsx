import { formatMediumDate, isExpired } from "@/utils/date-time";
import { pickDocument } from "@/utils/file-pickers";
import { error } from "@/utils/logger";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
import Header from "../../components/Header";
import {
  DocumentPreviewModal,
  PreviewFile,
} from "../../components/document-preview-modal";
import { Colors, Radii } from "../../constants/theme";
import { IDocument } from "../../data-types/documents";
import { useColorScheme } from "../../hooks/use-color-scheme";

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

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

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
      Alert.alert("Error", "Could not open the file picker. Please try again.");
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
        { document_id: document.document_id, file, expiry_date: expiryDate },
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

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <View
          style={[
            styles.errorScreen,
            { backgroundColor: theme.whiteBackground },
          ]}
        >
          <View
            style={[
              styles.errorCard,
              { backgroundColor: theme.whiteBackground },
            ]}
          >
            <View
              style={[
                styles.errorIconWrap,
                { backgroundColor: theme.mutedText },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={34}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.errorTitle, { color: theme.primaryText }]}>
              Loading document...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  if (!document) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <Header
          title="Document Details"
          onBack={() => router.canGoBack() && router.back()}
        />
        <View
          style={[
            styles.errorScreen,
            { backgroundColor: theme.whiteBackground },
          ]}
        >
          <View
            style={[
              styles.errorCard,
              { backgroundColor: theme.whiteBackground },
            ]}
          >
            <View
              style={[
                styles.errorIconWrap,
                { backgroundColor: theme.mutedText },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={34}
                color={theme.danger}
              />
            </View>
            <Text style={[styles.errorTitle, { color: theme.primaryText }]}>
              Document not found.
            </Text>
            <Pressable
              style={[
                styles.errorSecondaryBtn,
                {
                  backgroundColor: theme.whiteBackground,
                },
              ]}
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons
                name="return-up-back"
                size={18}
                color={theme.errorSubtitle}
              />
              <Text
                style={[
                  styles.errorSecondaryText,
                  { color: theme.errorSubtitle },
                ]}
              >
                Go back
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const expired = isExpired(document.expiry_date);
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <Header
        title={document.document.name}
        onBack={() => router.canGoBack() && router.back()}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { backgroundColor: theme.whiteBackground },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.sectionCard,
            { marginTop: 16 },
            expired && {
              borderColor: theme.danger,
              backgroundColor: theme.danger + "10",
            },
          ]}
        >
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                expired
                  ? {
                      backgroundColor: theme.danger + "22",
                      borderColor: theme.danger,
                    }
                  : document.document.status === "active"
                  ? {
                      backgroundColor: theme.primary + "22",
                      borderColor: theme.primary,
                    }
                  : {
                      backgroundColor: theme.danger + "22",
                      borderColor: theme.danger,
                    },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  {
                    color: expired
                      ? theme.danger
                      : document.document.status === "active"
                      ? theme.primary
                      : theme.danger,
                  },
                ]}
              >
                {expired
                  ? "Expired"
                  : document.document.status === "active"
                  ? "Active"
                  : "Inactive"}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Document Info</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{document.document.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>File</Text>
            <Text style={styles.detailValue}>{document.document_name}</Text>
          </View>
          {document.document.expiry_date_mandatory === "yes" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <Text
                style={[styles.detailValue, expired && { color: theme.danger }]}
              >
                {formatMediumDate(document.expiry_date)}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approval Status</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    document.document_approval === "approved"
                      ? theme.primary
                      : theme.danger,
                },
              ]}
            >
              {document.document_approval}{" "}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.sectionCard,
            expired && {
              borderColor: theme.danger,
              backgroundColor: theme.danger + "10",
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Meta</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{document.document.doc_type}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mandatory</Text>
            <Text style={styles.detailValue}>
              {document.document.mandatory_status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={[styles.detailValue, expired && { color: theme.danger }]}
            >
              {expired ? "expired" : document.document.status}
            </Text>
          </View>
        </View>

        {isUploading && (
          <View style={styles.uploadBanner}>
            <View style={styles.uploadBannerHeader}>
              <Text style={styles.uploadBannerText}>
                Uploading new file
                {uploadProgress != null ? ` — ${uploadProgress}%` : "…"}
              </Text>
              <TouchableOpacity onPress={handleCancelUpload}>
                <Text style={styles.uploadBannerCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.uploadProgressTrack}>
              <View
                style={[
                  styles.uploadProgressFill,
                  { width: `${uploadProgress ?? 8}%` },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.previewActionButton]}
            onPress={handlePreview}
            disabled={isPreviewLoading || isUploading}
          >
            {isPreviewLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="eye-outline" size={18} color={theme.primary} />
            )}
            <Text style={styles.previewActionButtonText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleReplace}
            disabled={isUploading}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={theme.whiteText}
            />
            <Text style={styles.buttonText}>Re Upload</Text>
          </TouchableOpacity>
        </View>
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
        <View style={styles.expiryBackdrop}>
          <View
            style={[
              styles.expiryCard,
              { backgroundColor: theme.whiteBackground },
            ]}
          >
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
              Expiry date required
            </Text>
            <Text style={[styles.detailLabel, { marginBottom: 12 }]}>
              This document needs an expiry date to be submitted.
            </Text>
            <TextInput
              value={expiryDraft}
              onChangeText={(value) => {
                setExpiryDraft(value);
                setExpiryError(null);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.secondaryText}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: theme.grayBorder }]}
            />
            {expiryError && (
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.danger, marginTop: 6 },
                ]}
              >
                {expiryError}
              </Text>
            )}
            <View style={[styles.actions, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setPendingFile(null)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={confirmReplacementWithExpiry}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
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

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    content: {
      flex: 1,
      paddingBottom: 80,
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 10,
    },
    sectionCard: {
      marginTop: 12,
      borderRadius: Radii.md,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.whiteBackground,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.tertiaryText,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    detailRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    detailLabel: {
      fontSize: 12,
      color: theme.secondaryText,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.tertiaryText,
      marginTop: 4,
      textTransform: "capitalize",
    },
    input: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.tertiaryText,
      marginTop: 4,
      borderBottomWidth: 1,
      borderColor: theme.grayBorder,
      paddingVertical: 2,
      paddingHorizontal: 0,
      minWidth: 120,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "flex-end",
    },
    button: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: Radii.sm,
      backgroundColor: theme.primary,
    },
    cancelButton: {
      backgroundColor: theme.danger,
    },
    buttonText: {
      color: theme.whiteText,
      marginLeft: 8,
      fontSize: 14,
    },
    previewActionButton: {
      backgroundColor: theme.whiteBackground,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    previewActionButtonText: {
      color: theme.primary,
      marginLeft: 8,
      fontSize: 14,
    },
    uploadBanner: {
      marginTop: 12,
      marginBottom: 4,
      padding: 12,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: theme.heroBorder,
      backgroundColor: theme.heroBg,
      gap: 8,
    },
    uploadBannerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    uploadBannerText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primaryText,
    },
    uploadBannerCancel: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.danger,
    },
    uploadProgressTrack: {
      height: 6,
      borderRadius: Radii.xs,
      backgroundColor: theme.grayBorder,
      overflow: "hidden",
    },
    uploadProgressFill: {
      height: "100%",
      borderRadius: Radii.xs,
      backgroundColor: theme.primary,
    },
    expiryBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.42)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    expiryCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: Radii.lg,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.grayBorder,
    },
    errorScreen: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    errorCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: theme.whiteBackground,
      borderRadius: Radii.lg,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: theme.grayBorder,
      alignItems: "center",
      shadowColor: theme.darkText,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 3,
    },
    errorIconWrap: {
      width: 64,
      height: 64,
      borderRadius: Radii.full,
      backgroundColor: theme.mutedText,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.errorTitle,
    },
    errorSecondaryBtn: {
      backgroundColor: theme.whiteBackground,
      paddingVertical: 12,
      borderRadius: Radii.sm,
      alignItems: "center",
      width: "50%",
      display: "flex",
      alignContent: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    errorSecondaryText: {
      color: theme.errorSubtitle,
      fontSize: 14,
      fontWeight: "500",
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 8,
    },
    statusChip: {
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: Radii.full,
      borderWidth: 1.5,
      alignSelf: "flex-start",
      marginBottom: 2,
    },
    statusChipText: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

export default DocumentDetails;
