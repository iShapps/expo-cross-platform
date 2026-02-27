import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { updateAvailability } from "@/api-queries/profile";
import Header from "@/components/Header";
import { useProfileData } from "@/data-store/use-account-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../ctx";

export default function More() {
  const { signOut } = useSession();
  const queryClient = useQueryClient();
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const hcp = userDetails?.hcp;
  const [isAvailable, setIsAvailable] = useState(
    Boolean(hcp?.available_for_job),
  );

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

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
    const status = value ? 1 : 0;

    // optimistic UI update
    setIsAvailable(value);

    updateAvailabilityMutation.mutate(status, {
      onSuccess: (response) => {
        if (response.status) {
          queryClient.setQueryData(["profile-details"], (oldData: any) => {
            return {
              ...oldData,
              hcp: {
                ...oldData?.hcp,
                available_for_job: status === 1,
              },
            };
          });

          Alert.alert("Success", response.message);
        } else {
          setIsAvailable(!value);
          Alert.alert("Error", response.message);
        }
      },
      onError: () => {
        setIsAvailable(!value);
        Alert.alert("Error", "An error occurred while updating your status.");
      },
    });
  };
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
                  source={{ uri: userDetails?.hcp.image }}
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
              <View style={styles.profileTagRow}>
                <Text style={styles.profileTag}>
                  {userDetails?.hcp?.hcp_professions?.[0]?.profession?.name ??
                    "—"}
                </Text>
                <Text style={styles.profileTagDivider}>•</Text>
                <Text style={styles.profileTag}>
                  {userDetails?.hcp?.hcp_professions?.[0]?.level?.name ?? "—"}
                </Text>
                <Text style={styles.profileTagDivider}>•</Text>
                <Text style={styles.profileTag}>
                  {userDetails?.hcp?.hcp_professions?.[0]?.category?.name ??
                    "—"}
                </Text>
              </View>
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
                onValueChange={toggleAvailability}
                disabled={updateAvailabilityMutation.isPending}
                thumbColor={isAvailable ? "#fff" : "#f4f4f4"}
                trackColor={{ false: "#E5E7EB", true: "#70C601" }}
              />
            </View>
          </View>
        </View>
        <View style={styles.linksSection}>
          <Pressable
            onPress={() => router.push("/(main)/account")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <MaterialCommunityIcons
                name="account-cog-outline"
                size={24}
                color="#70C601"
              />
              <Text style={styles.rowText}>Your profile</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
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
                color="#70C601"
              />
              <Text style={styles.rowText}>Facilities</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(main)/interviews")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Ionicons
                name="calendar-clear-outline"
                size={24}
                color="#70C601"
              />
              <Text style={styles.rowText}>Interviews</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(main)/settings")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Feather name="settings" size={24} color="#70C601" />
              <Text style={styles.rowText}>Settings</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </Pressable>
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
      borderRadius: 5,
      padding: 14,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#F0F0F0",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      width: "100%",
    },
    scroll: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#ffffff",
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    scrollContent: {
      paddingBottom: 24,
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
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#F8FFF0",
      borderRadius: 5,
      padding: 14,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#E6F0D8",
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    avatarContainer: {
      height: 68,
      width: 68,
      borderRadius: 34,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#EAF7D2",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      height: "100%",
      width: "100%",
      borderRadius: 34,
    },
    rowText: {
      color: colorScheme === "dark" ? "#fff" : "#111",
    },
    avatarFallback: {
      fontSize: 22,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#b0b8ca" : "#70C601",
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 16,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#fff" : "#111",
    },
    profileEmail: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#fff" : "#6B7280",
      marginTop: 2,
    },
    profileTagRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    profileTag: {
      fontSize: 11,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#FFD966" : "#3B4B3F",
      backgroundColor: colorScheme === "dark" ? "#adb3b7" : "#EAF7D2",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    profileTagDivider: {
      color: colorScheme === "dark" ? "#FFD966" : "#9CA3AF",
      fontSize: 12,
    },
    serviceIContainer: {
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#f4f4f4",
      padding: 4,
      height: 100,
      width: 100,
      borderRadius: 50,
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
      color: colorScheme === "dark" ? "#FFD966" : undefined,
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
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      gap: 25,
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
      // borderWidth: 1,
      // borderColor: colorScheme === "dark" ? "#36454F" : "#D3D3D3",
    },
    locationText: {
      fontFamily: "Roboto",
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#fff" : "#fff",
    },
    searchInputContainer: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      gap: 15,
      borderBottomColor: colorScheme === "dark" ? "#36454F" : "#d3d3d3",
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
      borderBottomColor: colorScheme === "dark" ? "#36454F" : "#f4f4f4",
      paddingVertical: 12,
    },
    currentLocationText: {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#FFD966" : undefined,
    },
    formLabelText: {
      color: colorScheme === "dark" ? "#FFD966" : "gray",
    },
    formInput: {
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#F4F4F4",
      borderRadius: 7,
      padding: 9,
      color: colorScheme === "dark" ? "#FFD966" : undefined,
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
      backgroundColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
      borderRadius: 22,
      padding: 12,
      color: colorScheme === "dark" ? "#232A2E" : "#ffffff",
      justifyContent: "center",
      alignItems: "center",
    },
    buttonText: {
      color: colorScheme === "dark" ? "#232A2E" : "#ffffff",
    },
    dropdown: {
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#F4F4F4",
      borderRadius: 7,
      padding: 9,
      color: colorScheme === "dark" ? "#FFD966" : undefined,
    },
    icon: {
      marginRight: 5,
    },
    placeholderStyle: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFD966" : undefined,
    },
    selectedTextStyle: {
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFD966" : undefined,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 16,
      color: colorScheme === "dark" ? "#FFD966" : undefined,
    },
  });
