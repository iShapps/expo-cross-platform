import { useColorScheme } from "@/hooks/use-color-scheme";
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AccountScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <Pressable
          onPress={() => router.canGoBack() && router.back()}
          style={styles.backIconContainer}
        >
          <Fontisto
            name="arrow-left-l"
            size={15}
            color={colorScheme === "dark" ? "#b0b8ca" : "white"}
          />
        </Pressable>
        <Text style={styles.locationText}>Account</Text>
        <Pressable style={styles.faintbackIconContainer}></Pressable>
      </View>

      <View style={styles.linksContainer}>
        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.profileLinks}
        >
          <View style={styles.profileContainer}>
            <MaterialCommunityIcons
              name="account-cog-outline"
              size={24}
              color={colorScheme === "dark" ? "#b0b8ca" : "#70C601"}
            />
            <Text
              style={{ color: colorScheme === "dark" ? "#fff" : undefined }}
            >
              My account
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colorScheme === "dark" ? "#b0b8ca" : "#70C601"}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/change-password")}
          style={styles.profileLinks}
        >
          <View style={styles.profileContainer}>
            <MaterialCommunityIcons
              name="lock-reset"
              size={24}
              color={colorScheme === "dark" ? "#b0b8ca" : "#70C601"}
            />
            <Text
              style={{ color: colorScheme === "dark" ? "#fff" : undefined }}
            >
              Change password
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colorScheme === "dark" ? "#b0b8ca" : "#70C601"}
          />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
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
    locationText: {
      fontFamily: "Roboto",
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#fff" : "#ffffff",
    },
    linksContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      width: "100%",
      marginVertical: 5,
      paddingHorizontal: 10,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      flex: 1,
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
      borderBottomColor: colorScheme === "dark" ? "#232A2E" : "#f4f4f4",
      paddingVertical: 12,
    },
    profileContainer: {
      display: "flex",
      flexDirection: "row",
      gap: 6,
      alignContent: "center",
      alignItems: "center",
      flex: 1,
    },
  });
