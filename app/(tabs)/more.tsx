import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useProfileData } from "@/data-store/use-account-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSession } from "../ctx";

export default function More() {
  const { signOut } = useSession();
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const hcp = userDetails?.hcp;
  const [isAvailable, setIsAvailable] = useState(
    Boolean(hcp?.available_for_job),
  );

  const handleLogout = () => {
    signOut();
    // router.replace("/(main)/index")
  };
  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="black" />
        </TouchableOpacity>
        <Text style={styles.locationText}>Profile</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.backIconContainer}
        >
          <AntDesign name="login" size={15} color="black" />
        </TouchableOpacity>
      </View>
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
                onValueChange={setIsAvailable}
                thumbColor={isAvailable ? "#fff" : "#f4f4f4"}
                trackColor={{ false: "#E5E7EB", true: "#70C601" }}
              />
            </View>
          </View>
        </View>
        <View style={styles.linksSection}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/account")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <MaterialCommunityIcons
                name="account-cog-outline"
                size={24}
                color="#70C601"
              />
              <Text>Your profile</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/facilities")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <MaterialCommunityIcons
                name="office-building-marker"
                size={24}
                color="#70C601"
              />
              <Text>Facilities</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/interviews")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Ionicons
                name="calendar-clear-outline"
                size={24}
                color="#70C601"
              />
              <Text>Interviews</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Feather name="settings" size={24} color="#70C601" />
              <Text>Settings</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: "#F0F0F0",
    backgroundColor: "#fff",
    width: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    backgroundColor: "#F8FFF0",
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6F0D8",
    flexDirection: "row",
    // alignItems: "center",
    gap: 12,
    width: "100%",
  },
  avatarContainer: {
    height: 68,
    width: 68,
    borderRadius: 34,
    backgroundColor: "#EAF7D2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    height: "100%",
    width: "100%",
    borderRadius: 34,
  },
  avatarFallback: {
    fontSize: 22,
    fontWeight: "700",
    color: "#70C601",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  profileEmail: {
    fontSize: 12,
    color: "#6B7280",
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
    color: "#3B4B3F",
    backgroundColor: "#EAF7D2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  profileTagDivider: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  serviceIContainer: {
    backgroundColor: "#f4f4f4",
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
    gap: 25,
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
  locationText: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
  },
  searchInputContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: 15,
    borderBottomColor: "#d3d3d3",
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
    borderBottomColor: "#f4f4f4",
    paddingVertical: 12,
  },
  currentLocationText: {
    fontFamily: "Roboto",
    fontSize: 16,
    fontWeight: "500",
  },
  formLabelText: {
    color: "gray",
  },
  formInput: {
    backgroundColor: "#F4F4F4",
    borderRadius: 7,
    padding: 9,
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
    backgroundColor: "#70C601",
    borderRadius: 22,
    padding: 12,
    color: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
  },

  dropdown: {
    backgroundColor: "#F4F4F4",
    borderRadius: 7,
    padding: 9,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
