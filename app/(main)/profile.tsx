import { updateAvailability } from "@/api-queries/profile";
import Header from "@/components/Header";
import { Colors } from "@/constants/theme";
import { useConfigSettings } from "@/data-store/config-store";
import { User } from "@/data-types/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatMediumDate } from "@/utils/date-time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const configSettings = useConfigSettings();
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const queryClient = useQueryClient();

  const { data: userDetails } = useQuery<User>({
    queryKey: ["profile-details"],
    queryFn: () => queryClient.getQueryData<User>(["profile-details"]) as User,
    enabled: false,
    staleTime: Infinity,
  });
  const hcp = userDetails?.hcp;
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);
  const isAvailable =
    optimisticValue !== null
      ? optimisticValue
      : Boolean(hcp?.available_for_job);

  const professions = hcp?.hcp_professions ?? [];

  const updateAvailabilityMutation = useMutation({
    mutationFn: (status: number) => updateAvailability(status),
  });

  const toggleAvailability = (value: boolean) => {
    setOptimisticValue(value);
    updateAvailabilityMutation.mutate(value ? 1 : 0, {
      onSuccess: (response) => {
        setOptimisticValue(null);
        if (response.status) {
          queryClient.setQueryData<User | undefined>(
            ["profile-details"],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                hcp: { ...old.hcp, available_for_job: value ? 1 : 0 },
              };
            },
          );
          Alert.alert("Success", response.message);
        } else {
          Alert.alert("Error", response.message);
        }
      },
      onError: () => {
        setOptimisticValue(null);
        Alert.alert("Error", "An error occurred while updating your status.");
      },
    });
  };

  const avatarImageSource = `${configSettings?.configSettings?.image_path?.hcp_path}${encodeURIComponent(
    `${userDetails?.hcp?.hcp_prefix}${userDetails?.hcp?.id}`,
  )}/image/${userDetails?.hcp?.image}`;
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Profile" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {hcp?.image ? (
              <Image
                source={{ uri: avatarImageSource }}
                style={styles.avatarImage}
              />
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
                Toggle your availability for shifts
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              disabled={updateAvailabilityMutation.isPending}
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
              {formatMediumDate(hcp?.date_of_birth ? hcp?.date_of_birth : "—")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>
              {hcp?.gender
                ? `${hcp?.gender?.charAt(0).toLocaleUpperCase()}${hcp?.gender?.slice(1)}`
                : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Professions</Text>
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
                  <View
                    style={[
                      styles.detailRow,
                      {
                        borderBottomColor: theme.primary,
                        borderBottomWidth: 2,
                      },
                    ]}
                  >
                    <Text style={styles.detailLabel}>Level</Text>
                    <Text style={styles.detailValue}>
                      {item?.level?.name ?? "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          {/* <View style={styles.detailRow}>
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
          </View> */}
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

      {updateAvailabilityMutation.isPending && (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <BlurView
            intensity={45}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.busyCard}>
            <ActivityIndicator size="large" color={theme.white} />
            <Text style={styles.busyText}>Updating profile status...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      height: "100%",
      width: "100%",
      backgroundColor: theme.background,
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
      backgroundColor: theme.background,
      paddingHorizontal: 10,
    },
    locationText: {
      fontFamily: "Roboto",
      fontSize: 18,
      fontWeight: "700",
      color: theme.white,
    },
    content: {
      paddingHorizontal: 10,
      paddingBottom: 32,
      backgroundColor: theme.whiteBackground,
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
      borderColor: theme.greyBorder,
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
      borderColor: theme.background,
    },
    backSpacer: {
      width: 52,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.primaryText,
    },
    heroCard: {
      marginTop: 8,
      backgroundColor: theme.heroBg,
      borderRadius: 5,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    avatarWrap: {
      height: 64,
      width: 64,
      borderRadius: 5,
      backgroundColor: theme.heroIconBg,
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
      color: theme.activeText,
    },
    heroContent: {
      flex: 1,
    },
    heroName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.tertiaryText,
    },
    heroMeta: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 2,
    },
    sectionCard: {
      marginTop: 12,
      borderRadius: 5,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      backgroundColor: theme.whiteBackground,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.primary,
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
      color: theme.tertiaryText,
    },
    rowSubtitle: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 2,
    },
    detailRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.greyBorder,
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
      color: theme.secondaryText,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.tertiaryText,
      marginTop: 4,
    },
    busyOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
      elevation: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(10, 16, 26, 0.18)",
    },
    busyCard: {
      minWidth: 220,
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: "center",
      gap: 12,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
    },
    busyText: {
      color: theme.white,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
  });
