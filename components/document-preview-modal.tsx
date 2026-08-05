import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { PdfView } from "@kishannareshpal/expo-pdf";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
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
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme, actions.length > 0);

  const [loading, setLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!visible || !file) {
      setPdfError(false);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [visible, file]);

  if (!file) return null;

  const uri = file.uri;
  const isImage = file.mimeType?.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

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
            ) : isPdf && uri && !pdfError ? (
              <>
                <PdfView
                  uri={uri}
                  style={styles.webView}
                  onLoadComplete={() => setLoading(false)}
                  onError={() => {
                    setPdfError(true);
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
            ) : isPdf && pdfError ? (
              <View style={styles.previewOpenFallback}>
                <Ionicons
                  name="document-text-outline"
                  size={56}
                  color={theme.secondaryText}
                />
                <Text style={styles.previewFallback} numberOfLines={2}>
                  PDF preview unavailable
                </Text>
                <TouchableOpacity
                  style={styles.openInViewerButton}
                  onPress={() => Linking.openURL(uri).catch(() => null)}
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
                  onPress={() => Linking.openURL(uri).catch(() => null)}
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
            <TouchableOpacity onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: typeof Colors.light, hasActions: boolean) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.42)",
      justifyContent: "flex-end",
    },
    previewSheet: {
      maxHeight: "86%",
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      backgroundColor: theme.whiteBackground,
      padding: 16,
      gap: 14,
    },
    previewHandle: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.grayBorder,
    },
    previewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    previewTitle: {
      color: theme.primaryText,
      fontSize: 18,
      fontWeight: "800",
    },
    previewFileName: {
      color: theme.secondaryText,
      fontSize: 12,
      marginTop: 3,
      maxWidth: 260,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroBg,
    },
    previewFrame: {
      height: 390,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      overflow: "hidden",
      backgroundColor: theme.heroBg,
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
      backgroundColor: theme.whiteBackground,
    },
    previewFallback: {
      color: theme.secondaryText,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 16,
    },
    previewOpenFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 16,
    },
    openInViewerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 4,
    },
    openInViewerText: {
      color: theme.white,
      fontWeight: "700",
      fontSize: 14,
    },
    previewActions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    actionButtonPrimary: {
      backgroundColor: theme.primary,
    },
    actionButtonDanger: {
      borderWidth: 1,
      borderColor: theme.danger,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: "800",
    },
    doneButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 8,
      backgroundColor: hasActions ? theme.heroBg : theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    doneButtonText: {
      color: hasActions ? theme.primaryText : theme.white,
      fontSize: 14,
      fontWeight: "800",
    },
  });
