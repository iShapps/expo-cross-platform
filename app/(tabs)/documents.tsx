import { useProfileData } from "@/data-store/use-account-store";
import { router } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DocumentsScreen() {
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const hcp = userDetails?.hcp;

  const documents = [
    {
      label: "CV",
      value: hcp?.cv,
    },
    {
      label: "Registration Number",
      value: hcp?.registration_number,
    },
    {
      label: "ABN",
      value: hcp?.abn_number,
    },
    {
      label: "TFN",
      value: hcp?.tfn_number,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/more")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Documents</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.listCard}>
          {documents.map((doc) => (
            <View key={doc.label} style={styles.docRow}>
              <View>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docValue}>
                  {doc.value ?? "Not available"}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  doc.value ? styles.statusPillOk : styles.statusPillMissing,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    doc.value ? styles.statusTextOk : styles.statusTextMissing,
                  ]}
                >
                  {doc.value ? "On file" : "Missing"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backText: {
    color: "#70C601",
    fontWeight: "600",
  },
  backSpacer: {
    width: 52,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  listCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  docLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  docValue: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillOk: {
    backgroundColor: "#E8F6D3",
  },
  statusPillMissing: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextOk: {
    color: "#2E7D32",
  },
  statusTextMissing: {
    color: "#B91C1C",
  },
});
