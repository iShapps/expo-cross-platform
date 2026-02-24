import Header from "@/components/Header";
import { useProfileData } from "@/data-store/use-account-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const hcp = userDetails?.hcp;
  const professions = hcp?.hcp_professions ?? [];
  const [isAvailable, setIsAvailable] = useState(
    Boolean(hcp?.available_for_job),
  );

  useEffect(() => {
    setIsAvailable(Boolean(hcp?.available_for_job));
  }, [hcp?.available_for_job]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Profile" onBack={() => router.back()} />
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
          {professions.length > 0 && (
            <View style={styles.professionList}>
              {professions.map((item: any) => (
                <View key={String(item?.id)} style={styles.professionItem}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Profession</Text>
                    <Text style={styles.detailValue}>
                      {item?.profession?.name ?? "—"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>
                      {item?.category?.name ?? "—"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Level</Text>
                    <Text style={styles.detailValue}>
                      {item?.level?.name ?? "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{hcp?.address ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Suburb</Text>
            <Text style={styles.detailValue}>{hcp?.suburb_name ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>City</Text>
            <Text style={styles.detailValue}>{hcp?.city_name ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>State</Text>
            <Text style={styles.detailValue}>
              {hcp?.state_id ? String(hcp?.state_id) : "—"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Post code</Text>
            <Text style={styles.detailValue}>{hcp?.post_code ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Country</Text>
            <Text style={styles.detailValue}>
              {hcp?.country_id ? String(hcp?.country_id) : "—"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    container: {
      flex: 1,
      height: "100%",
      width: "100%",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      paddingVertical: 50,
    },
    topBarContainer: {
      display: "flex",
      flexDirection: "row",
      alignContent: "center",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 25,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      paddingHorizontal: 10,
    },
    locationText: {
      fontFamily: "Roboto",
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#fff" : "#ffffff",
    },
    content: {
      paddingHorizontal: 10,
      paddingBottom: 32,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
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
      borderColor: colorScheme === "dark" ? "#b0b8ca" : "#D3D3D3",
    },
    faintbackIconContainer: {
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
      borderColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    backSpacer: {
      width: 52,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
    },
    heroCard: {
      marginTop: 8,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#F8FFF0",
      borderRadius: 5,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#E6F0D8",
    },
    avatarWrap: {
      height: 64,
      width: 64,
      borderRadius: 5,
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#EAF7D2",
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
      color: colorScheme === "dark" ? "#b0b8ca" : "#70C601",
    },
    heroContent: {
      flex: 1,
    },
    heroName: {
      fontSize: 16,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
    },
    heroMeta: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#b0b8ca" : "#6B7280",
      marginTop: 2,
    },
    sectionCard: {
      marginTop: 12,
      borderRadius: 5,
      padding: 14,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#F0F0F0",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
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
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
    },
    rowSubtitle: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#b0b8ca" : "#6B7280",
      marginTop: 2,
    },
    detailRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#232A2E" : "#F3F4F6",
    },
    professionList: {
      gap: 12,
      marginBottom: 4,
    },
    professionItem: {
      gap: 4,
    },
    detailLabel: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#b0b8ca" : "#6B7280",
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
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
      backgroundColor: colorScheme === "dark" ? "#b0b8ca" : "#70C601",
    },
    primaryButtonText: {
      color: colorScheme === "dark" ? "#232A2E" : "#fff",
      fontWeight: "700",
    },
    outlineButton: {
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#b0b8ca" : "#E5E7EB",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
    },
    outlineButtonText: {
      color: colorScheme === "dark" ? "#b0b8ca" : "#111",
      fontWeight: "700",
    },
  });
