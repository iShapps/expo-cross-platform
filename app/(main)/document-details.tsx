import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
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

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    document_name: "",
    start_date: "",
    expiry_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [filePreviewUri, setFilePreviewUri] = useState<string | null>(null);

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
      setForm({
        document_name: parsed.document_name,
        start_date: parsed.start_date,
        expiry_date: parsed.expiry_date,
      });
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
      setForm(
        found
          ? {
              document_name: found.document_name,
              start_date: found.start_date,
              expiry_date: found.expiry_date,
            }
          : { document_name: "", start_date: "", expiry_date: "" },
      );
      setLoading(false);
    }
    if (id) fetchDocument();
  }, [id, doc]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    if (document) {
      setForm({
        document_name: document.document_name,
        start_date: document.start_date,
        expiry_date: document.expiry_date,
      });
    }
    setIsEditing(false);
  };
  const handleSave = async () => {};
  const handlePickFile = async () => {
    // const file = await pickDocument();
    // if (file) {
    //   setSelectedFile(file);
    //   setFilePreviewUri(null);
    // }
  };
  const handlePickImage = async () => {
    // const image = await pickImageFromLibrary();
    // if (image) {
    //   setSelectedFile(image);
    //   setFilePreviewUri(image.uri);
    // }
  };
  const handleTakePhoto = async () => {
    // const image = await pickImageFromCamera();
    // if (image) {
    //   setSelectedFile(image);
    //   setFilePreviewUri(image.uri);
    // }
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
            {isEditing ? (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <Pressable
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handlePickFile}
                  >
                    <Ionicons
                      name="document-outline"
                      size={18}
                      color={theme.white}
                    />
                    <Text style={styles.buttonText}>Pick File</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handlePickImage}
                  >
                    <Ionicons
                      name="image-outline"
                      size={18}
                      color={theme.white}
                    />
                    <Text style={styles.buttonText}>Photo Library</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleTakePhoto}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={18}
                      color={theme.white}
                    />
                    <Text style={styles.buttonText}>Take Photo</Text>
                  </Pressable>
                </View>
                {filePreviewUri ? (
                  <Image
                    source={{ uri: filePreviewUri }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  />
                ) : selectedFile ? (
                  <Text style={{ color: theme.primary, marginBottom: 8 }}>
                    {selectedFile.name || selectedFile.uri}
                  </Text>
                ) : null}
                <Text style={{ color: theme.secondaryText, fontSize: 12 }}>
                  Only the file can be updated. Select a document or image to
                  upload.
                </Text>
              </View>
            ) : (
              <Text style={styles.detailValue}>{document.document_name}</Text>
            )}
          </View>
          {/* if has expiry date and its mandatory */}
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
        {/* <View style={styles.actions}>
          {isEditing ? (
            <>
              <Pressable
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Ionicons name="save-outline" size={18} color={theme.white} />
                <Text style={styles.buttonText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Ionicons name="close-outline" size={18} color={theme.white} />
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={20} color={theme.white} />
              <Text style={styles.buttonText}>Edit</Text>
            </Pressable>
          )}
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 80,
    backgroundColor: Colors.light.whiteBackground,
    paddingHorizontal: 10,
  },
  sectionCard: {
    marginTop: 12,
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.grayBorder,
    backgroundColor: Colors.light.whiteBackground,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.tertiaryText,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.tertiaryText,
    marginTop: 4,
    textTransform: "capitalize",
  },
  input: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.tertiaryText,
    marginTop: 4,
    borderBottomWidth: 1,
    borderColor: Colors.light.grayBorder,
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
    backgroundColor: Colors.light.primary,
  },
  cancelButton: {
    backgroundColor: Colors.light.danger,
  },
  buttonText: {
    color: Colors.light.whiteText,
    marginLeft: 8,
    fontSize: 14,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: Colors.light.whiteBackground,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Colors.light.whiteBackground,
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.light.grayBorder,
    alignItems: "center",
    shadowColor: Colors.light.darkText,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.mutedText,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.errorTitle,
  },
  errorSecondaryBtn: {
    backgroundColor: Colors.light.whiteBackground,
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
    color: Colors.light.errorSubtitle,
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
