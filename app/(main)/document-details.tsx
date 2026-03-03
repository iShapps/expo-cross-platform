import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getDutyStatementDocuments,
  getGenaralStatementDocuments,
  getProfessionDocuments,
} from "../../api-queries/documents";
import Header from "../../components/Header";
import { Colors } from "../../constants/theme";
import { IDocument } from "../../data-types/documents";
import { useColorScheme } from "../../hooks/use-color-scheme";

const DocumentDetails = () => {
  const { id, doc } = useLocalSearchParams<{ id: string; doc?: string }>();
  const [document, setDocument] = useState<IDocument | null>(null);

  const [loading, setLoading] = useState(true);

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
        <View style={[styles.sectionCard, { marginTop: 16 }]}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                document.document.status === "active"
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
                    color:
                      document.document.status === "active"
                        ? theme.primary
                        : theme.danger,
                  },
                ]}
              >
                {document.document.status === "active" ? "Active" : "Inactive"}
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
              <Text style={styles.detailValue}>{document.expiry_date}</Text>
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
        <View style={styles.sectionCard}>
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
            <Text style={styles.detailValue}>{document.document.status}</Text>
          </View>
        </View>
      </ScrollView>
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
      borderRadius: 5,
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
      borderRadius: 3,
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
      borderRadius: 8,
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
      borderRadius: 32,
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
      borderRadius: 5,
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
      borderRadius: 16,
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
