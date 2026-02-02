import { useProfileData } from "@/data-store/use-account-store";
import Fontisto from "@expo/vector-icons/Fontisto";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const hcp = userDetails?.hcp;
  const [isAvailable, setIsAvailable] = useState(
    Boolean(hcp?.available_for_job),
  );

  useEffect(() => {
    setIsAvailable(Boolean(hcp?.available_for_job));
  }, [hcp?.available_for_job]);

  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/account")}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="black" />
        </TouchableOpacity>
        <Text style={styles.locationText}>Profile</Text>
        <TouchableOpacity></TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {hcp?.image ? (
              <Image source={{ uri: hcp.image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarFallback}>
                {userDetails?.name?.[0] ?? "H"}
              </Text>
            )}
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroName}>{userDetails?.name ?? "—"}</Text>
            <Text style={styles.heroMeta}>{userDetails?.email ?? "—"}</Text>
            <Text style={styles.heroMeta}>{hcp?.address ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.rowTitle}>Available for jobs</Text>
              <Text style={styles.rowSubtitle}>
                Toggle to appear in available shifts
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              thumbColor={isAvailable ? "#fff" : "#f4f4f4"}
              trackColor={{ false: "#E5E7EB", true: "#70C601" }}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Full name</Text>
            <Text style={styles.detailValue}>{userDetails?.name ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{hcp?.contact_number ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date of birth</Text>
            <Text style={styles.detailValue}>
              {hcp?.date_of_birth ? hcp?.date_of_birth : "—"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{hcp?.gender ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Professional</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registration No.</Text>
            <Text style={styles.detailValue}>
              {hcp?.registration_number ?? "—"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ABN</Text>
            <Text style={styles.detailValue}>{hcp?.abn_number ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TFN</Text>
            <Text style={styles.detailValue}>{hcp?.tfn_number ?? "—"}</Text>
          </View>
        </View>

        {/* <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/documents")}
            style={[styles.actionButton, styles.outlineButton]}
          >
            <Text style={styles.outlineButtonText}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/change-password")}
            style={[styles.actionButton, styles.primaryButton]}
          >
            <Text style={styles.primaryButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 30,
    // justifyContent:"center",
    // alignContent:"center",
    // alignItems:"center",
    paddingHorizontal: 10,
    paddingVertical: 60,
  },
  topBarContainer: {
    display: "flex",
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
  },

  locationText: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 0,
    paddingBottom: 32,
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
  backIconContainer: {
    height: 40,
    width: 40,
    borderRadius: 50,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    padding: 2,
    borderWidth: 1,
    borderColor: "#D3D3D3",
  },
  backSpacer: {
    width: 52,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  heroCard: {
    marginTop: 8,
    backgroundColor: "#F8FFF0",
    borderRadius: 5,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6F0D8",
  },
  avatarWrap: {
    height: 64,
    width: 64,
    borderRadius: 5,
    backgroundColor: "#EAF7D2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    height: "100%",
    width: "100%",
    borderRadius: 5,
  },
  avatarFallback: {
    fontSize: 22,
    fontWeight: "700",
    color: "#70C601",
  },
  heroContent: {
    flex: 1,
  },
  heroName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  heroMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sectionCard: {
    marginTop: 12,
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  rowSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
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
    fontWeight: "600",
    color: "#111",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#70C601",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  outlineButtonText: {
    color: "#111",
    fontWeight: "700",
  },
});
