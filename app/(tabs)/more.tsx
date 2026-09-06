import { isAuthError } from "@/api-actions/error-utils";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { updateAvailability } from "@/api-queries/profile";
import Header from "@/components/Header";
import { Colors, Radii } from "@/constants/theme";
import { useConfigSettings } from "@/data-store/config-store";
import { useProfileData } from "@/data-store/use-account-store";
import { User } from "@/data-types/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../ctx";

const WalkthroughableView = walkthroughable(View);

export default function More() {
  const { signOut } = useSession();
  const configSettings = useConfigSettings();
  const queryClient = useQueryClient();
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const hcp = userDetails?.hcp;
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);
  const isAvailable =
    optimisticValue !== null
      ? optimisticValue
      : Boolean(hcp?.available_for_job);

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const isFocused = useIsFocused();

  useFirstVisitTour("more", isFocused && !!userDetails);

  const handleLogout = () => {
    // add confirmation dialog
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes, Logout",
        style: "destructive",
        onPress: () => {
          signOut();
          // router.replace("/(main)/index");
        },
      },
    ]);
    // signOut();
    // router.replace("/(main)/index")
  };

  const updateAvailabilityMutation = useMutation({
    mutationFn: (status: number) => updateAvailability(status),
  });

  const toggleAvailability = (value: boolean) => {
    setOptimisticValue(value);
    updateAvailabilityMutation.mutate(value ? 1 : 0, {
      onSuccess: (response) => {
        setOptimisticValue(null);
        if (response.status) {
          const nextUserDetails = userDetails
            ? {
                ...userDetails,
                hcp: { ...userDetails.hcp, available_for_job: value ? 1 : 0 },
              }
            : null;

          profileStore.setUserDetails(nextUserDetails);
          queryClient.setQueryData<User | undefined>(
            ["profile-details"],
            (old) => {
              if (!old) return nextUserDetails ?? old;
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
      onError: (error) => {
        setOptimisticValue(null);
        if (isAuthError(error)) return;
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "An error occurred while updating your status.",
        );
      },
    });
  };

  const avatarImageSource = `${configSettings?.configSettings?.image_path?.hcp_path}${encodeURIComponent(
    `${userDetails?.hcp?.hcp_prefix}${userDetails?.hcp?.id}`,
  )}/image/${userDetails?.hcp?.image}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Profile"
        onBack={() => router.back()}
        right={
          <Pressable onPress={handleLogout} style={{ paddingRight: 10 }}>
            {/* <AntDesign name="login" size={20} color="white" /> */}
            <MaterialIcons name="login" size={24} color="white" />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {userDetails?.hcp && userDetails?.hcp.image ? (
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
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userDetails?.name ?? "—"}</Text>
              <Text style={styles.profileEmail}>
                {userDetails?.email ?? "—"}
              </Text>
              <View style={styles.profileTagCol}>
                {userDetails?.hcp?.hcp_professions?.map((prfession, index) => (
                  <Text key={index} style={styles.profileTag}>
                    • {prfession?.profession?.name ?? "—"}
                    {/* <Text style={styles.profileTagDivider}>•</Text> */}
                  </Text>
                ))}

                {/* <Text style={styles.profileTag}>
                  {userDetails?.hcp?.hcp_professions?.[0]?.level?.name ?? "—"}
                </Text>
                <Text style={styles.profileTagDivider}>•</Text>
                <Text style={styles.profileTag}>
                  {userDetails?.hcp?.hcp_professions?.[0]?.category?.name ??
                    "—"}
                </Text> */}
              </View>
            </View>
          </View>
          <CopilotStep
            name="more-availability"
            order={1}
            active={isFocused}
            text="Turn this on to let facilities know you're available for new shifts — turn it off anytime you don't want new offers."
          >
            <WalkthroughableView style={styles.sectionCard}>
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
                  trackColor={{ false: "#E5E7EB", true: theme.primary }}
                />
              </View>
            </WalkthroughableView>
          </CopilotStep>
        </View>
        <CopilotStep
          name="more-links"
          order={2}
          active={isFocused}
          text="Manage your profile details, browse the facilities you work with, and adjust app settings here."
        >
          <WalkthroughableView style={styles.linksSection}>
            <Pressable
              onPress={() => router.push("/(main)/account")}
              style={styles.profileLinks}
            >
              <View style={styles.profileContainer}>
                <MaterialCommunityIcons
                  name="account-cog-outline"
                  size={24}
                  color={theme.primary}
                />
                <Text style={styles.rowText}>Your profile</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.primary}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(main)/facilities")}
              style={styles.profileLinks}
            >
              <View style={styles.profileContainer}>
                <MaterialCommunityIcons
                  name="office-building-marker"
                  size={24}
                  color={theme.primary}
                />
                <Text style={styles.rowText}>Facilities</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.primary}
              />
            </Pressable>
            {/* <Pressable
            onPress={() => router.push("/(main)/interviews")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Ionicons
                name="calendar-clear-outline"
                size={24}
                color={theme.primary}
              />
              <Text style={styles.rowText}>Interviews</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.primary}
            />
          </Pressable> */}
            <Pressable
              onPress={() => router.push("/(main)/settings")}
              style={styles.profileLinks}
            >
              <View style={styles.profileContainer}>
                <Feather name="settings" size={24} color={theme.primary} />
                <Text style={styles.rowText}>Settings</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.primary}
              />
            </Pressable>
          </WalkthroughableView>
        </CopilotStep>
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
            <Text style={styles.busyText}>Updating availability...</Text>
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
      paddingTop: 50,
    },
    serviceView: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      margin: 8,
    },

    sectionCard: {
      marginTop: 12,
      borderRadius: Radii.sm,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      backgroundColor: theme.whiteBackground,
      width: "100%",
    },
    scroll: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.tertiaryText,
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
    topSection: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      gap: 5,
      alignItems: "flex-start",
    },
    linksSection: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      width: "100%",
      marginVertical: 5,
    },
    profileCard: {
      backgroundColor: theme.heroBg,
      borderRadius: Radii.sm,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.heroBorder,
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    avatarContainer: {
      height: 68,
      width: 68,
      borderRadius: Radii.full,
      backgroundColor: theme.heroIconBg,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      height: "100%",
      width: "100%",
      borderRadius: Radii.full,
    },
    rowText: {
      color: theme.primaryText,
    },
    avatarFallback: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.primary,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primaryText,
    },
    profileEmail: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 2,
    },
    profileTagRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    profileTagCol: {
      flexDirection: "column",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: 1,
      marginTop: 6,
    },
    profileTag: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.errorSubtitle,
      backgroundColor: theme.heroBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radii.full,
    },
    profileTagDivider: {
      color: theme.errorSubtitle,
      fontSize: 12,
    },
    serviceIContainer: {
      backgroundColor: theme.grayBorder,
      padding: 4,
      height: 100,
      width: 100,
      borderRadius: Radii.full,
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
    },
    truncatedText: {
      width: 50,
      overflow: "hidden",
      fontWeight: "bold",
      fontSize: 13,
      fontFamily: "Roboto",
      color: theme.primary,
    },
    profileContainer: {
      display: "flex",
      flexDirection: "row",
      gap: 6,
      alignContent: "center",
      alignItems: "center",
      flex: 1,
    },
    topBarContainer: {
      display: "flex",
      flexDirection: "row",
      alignContent: "center",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background,
      gap: 25,
      paddingHorizontal: 10,
    },
    backIconContainer: {
      height: 40,
      width: 40,
      borderRadius: Radii.full,
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
      padding: 2,
      // borderWidth: 1,
      // borderColor: colorScheme === "dark" ? "#36454F" : "#D3D3D3",
    },
    locationText: {
      fontFamily: "Roboto",
      fontSize: 18,
      fontWeight: "700",
      color: theme.white,
    },
    searchInputContainer: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      gap: 15,
      borderBottomColor: theme.greyBorder,
      borderBottomWidth: 1,
      paddingBottom: 25,
    },
    currentLocationContainer: {
      display: "flex",
      flexDirection: "row",
      width: "100%",
      gap: 15,
      alignContent: "center",
      alignItems: "center",
    },
    profileLinks: {
      width: "100%",
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignContent: "center",
      alignItems: "center",
      gap: 5,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
      paddingVertical: 12,
    },
    currentLocationText: {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "500",
      color: theme.activeText,
    },
    formLabelText: {
      color: theme.activeText,
    },
    formInput: {
      backgroundColor: theme.grayBorder,
      borderRadius: Radii.sm,
      padding: 9,
      color: theme.activeText,
    },
    formContainer: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      marginVertical: 10,
    },
    formItemContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      width: "100%",
    },
    button: {
      backgroundColor: theme.activeText,
      borderRadius: Radii.full,
      padding: 12,
      color: theme.whiteBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonText: {
      color: theme.whiteBackground,
    },
    dropdown: {
      backgroundColor: theme.grayBorder,
      borderRadius: Radii.sm,
      padding: 9,
      color: theme.activeText,
    },
    icon: {
      marginRight: 5,
    },
    placeholderStyle: {
      fontSize: 16,
      color: theme.activeText,
    },
    selectedTextStyle: {
      fontSize: 16,
      color: theme.activeText,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 16,
      color: theme.activeText,
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
      borderRadius: Radii.md,
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
