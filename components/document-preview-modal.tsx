import { Radius, Space, Touch, Type, type AppColors } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { PdfView } from "@kishannareshpal/expo-pdf";
import { Directory, File, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import { TokenStorage } from "@/utils/auth-api";
import { error as logError } from "@/utils/logger";
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type PreviewFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export type DocumentPreviewAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "danger";
  disabled?: boolean;
};

export function DocumentPreviewModal({
  visible,
  title,
  file,
  onClose,
  actions = [],
}: {
  visible: boolean;
  title: string;
  file: PreviewFile | null;
  onClose: () => void;
  actions?: DocumentPreviewAction[];
}) {
  const { colors } = useAppTheme();
  // The colour names the markup below uses, mapped onto the design palette.
  const theme = {
    primary: colors.primary,
    primaryText: colors.text,
    secondaryText: colors.textSecondary,
    white: colors.textOnPrimary,
    danger: colors.danger,
  };
  const styles = getStyles(colors, actions.length > 0);

  const [loading, setLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);
  const [localPdfUri, setLocalPdfUri] = useState<string | null>(null);

  const isPdf = file?.mimeType === "application/pdf";
  const remoteUri = file?.uri;

  useEffect(() => {
    if (!visible || !file) {
      setPdfError(false);
      setPdfErrorMessage(null);
      setLocalPdfUri(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (!isPdf || !remoteUri) return;

    // Files picked locally (not yet uploaded) are already a local file/content
    // URI — PdfView can use those directly, no download needed.
    if (!/^https?:\/\//i.test(remoteUri)) {
      setLocalPdfUri(remoteUri);
      return;
    }

    // PdfView only accepts local file URIs, not remote http(s) URLs — download
    // the file to cache first, per @kishannareshpal/expo-pdf's own docs.
    let cancelled = false;
    const destination = new Directory(Paths.cache, "pdf-previews");

    (async () => {
      try {
        destination.create({ intermediates: true, idempotent: true });
        const token = await TokenStorage.getToken();
        const downloaded = await File.downloadFileAsync(
          remoteUri,
          destination,
          {
            idempotent: true,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        if (!cancelled) setLocalPdfUri(downloaded.uri);
      } catch (err) {
        logError("PDF download failed:", err, remoteUri);
        if (!cancelled) {
          setPdfError(true);
          setPdfErrorMessage(
            err instanceof Error ? err.message : "Could not download file.",
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, file, isPdf, remoteUri]);

  if (!file) return null;

  const uri = file.uri;
  const isImage = file.mimeType?.startsWith("image/");

  const openFile = async (target: string) => {
    try {
      // Linking.openURL only handles remote URLs / registered schemes — a
      // local file:// (or content://) URI needs the native share/preview
      // sheet instead, which Linking can't provide.
      if (/^https?:\/\//i.test(target)) {
        await Linking.openURL(target);
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(target);
      } else {
        await Linking.openURL(target);
      }
    } catch (err) {
      logError("Failed to open file:", err, target);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.previewSheet}>
          <View style={styles.previewHandle} />

          <View style={styles.previewHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTitle}>{title}</Text>
              <Text style={styles.previewFileName} numberOfLines={1}>
                {file.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={20} color={theme.primaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewFrame}>
            {isImage && uri ? (
              <Image
                source={{ uri }}
                style={styles.previewImage}
                contentFit="contain"
              />
            ) : isPdf && localPdfUri && !pdfError ? (
              <>
                <PdfView
                  uri={localPdfUri}
                  style={styles.webView}
                  onLoadComplete={() => setLoading(false)}
                  onError={({ code, message }) => {
                    logError("PDF preview failed:", code, message, uri);
                    setPdfError(true);
                    setPdfErrorMessage(message || code);
                    setLoading(false);
                  }}
                />
                {loading && (
                  <ActivityIndicator
                    size="large"
                    color={theme.primary}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </>
            ) : isPdf && !pdfError ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : isPdf && pdfError ? (
              <View style={styles.previewOpenFallback}>
                <Ionicons
                  name="document-text-outline"
                  size={56}
                  color={theme.secondaryText}
                />
                <Text style={styles.previewFallback} numberOfLines={2}>
                  {pdfErrorMessage || "PDF preview unavailable"}
                </Text>
                <TouchableOpacity
                  style={styles.openInViewerButton}
                  onPress={() => void openFile(uri)}
                >
                  <Ionicons name="open-outline" size={16} color={theme.white} />
                  <Text style={styles.openInViewerText}>
                    Open in PDF viewer
                  </Text>
                </TouchableOpacity>
              </View>
            ) : uri ? (
              <View style={styles.previewOpenFallback}>
                <Ionicons
                  name="document-text-outline"
                  size={56}
                  color={theme.secondaryText}
                />
                <Text style={styles.previewFallback} numberOfLines={2}>
                  {file.name}
                </Text>
                <TouchableOpacity
                  style={styles.openInViewerButton}
                  onPress={() => void openFile(uri)}
                >
                  <Ionicons name="open-outline" size={16} color={theme.white} />
                  <Text style={styles.openInViewerText}>
                    Open in device viewer
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.previewFallback}>No preview available</Text>
            )}
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Close</Text>
            </TouchableOpacity>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.key}
                onPress={action.onPress}
                disabled={action.disabled}
                style={[
                  styles.actionButton,
                  action.variant === "danger"
                    ? styles.actionButtonDanger
                    : styles.actionButtonPrimary,
                  action.disabled && { opacity: 0.6 },
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={18}
                  color={
                    action.variant === "danger" ? theme.danger : theme.white
                  }
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    action.variant === "danger"
                      ? { color: theme.danger }
                      : { color: theme.white },
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: AppColors, hasActions: boolean) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    previewSheet: {
      maxHeight: "88%",
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      backgroundColor: colors.surface,
      padding: Space.gutter,
      paddingTop: Space.sm,
      paddingBottom: Space.xl,
      gap: Space.md,
    },
    previewHandle: {
      alignSelf: "center",
      width: 40,
      height: 5,
      borderRadius: Radius.full,
      backgroundColor: colors.borderStrong,
    },
    previewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Space.sm,
    },
    previewTitle: {
      ...Type.title3,
      color: colors.text,
    },
    previewFileName: {
      ...Type.footnote,
      color: colors.textSecondary,
      marginTop: 2,
    },
    iconButton: {
      width: Touch.min,
      height: Touch.min,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
    },
    previewFrame: {
      height: 400,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    previewImage: {
      width: "100%",
      height: "100%",
    },
    webView: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.surface,
    },
    previewFallback: {
      ...Type.subhead,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: Space.xs,
      paddingHorizontal: Space.md,
    },
    previewOpenFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Space.sm,
      padding: Space.md,
    },
    openInViewerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.xs,
      backgroundColor: colors.primary,
      paddingHorizontal: Space.lg,
      minHeight: Touch.min,
      borderRadius: Radius.full,
      marginTop: Space.xxs,
    },
    openInViewerText: {
      ...Type.buttonCompact,
      color: colors.textOnPrimary,
    },
    previewActions: {
      flexDirection: "row",
      gap: Space.sm,
    },
    actionButton: {
      flex: 1,
      minHeight: Touch.button,
      borderRadius: Radius.full,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Space.xs,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionButtonDanger: {
      borderWidth: 1.5,
      borderColor: colors.danger,
    },
    actionButtonText: {
      ...Type.button,
    },
    doneButton: {
      flex: 1,
      minHeight: Touch.button,
      borderRadius: Radius.full,
      backgroundColor: hasActions ? colors.surfaceMuted : colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    doneButtonText: {
      ...Type.button,
      color: hasActions ? colors.text : colors.textOnPrimary,
    },
  });
