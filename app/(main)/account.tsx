import Header from "@/components/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Account" onBack={() => router.back()} />

      <View style={styles.linksContainer}>
        <Pressable
          onPress={() => router.push("/(main)/profile")}
          style={styles.profileLinks}
        >
          <View style={styles.profileContainer}>
            <MaterialCommunityIcons
              name="account-cog-outline"
              size={24}
              color={theme.primary}
            />
            <Text style={{ color: theme.primaryText }}>My account</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.primary}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push("/(main)/change-password")}
          style={styles.profileLinks}
        >
          <View style={styles.profileContainer}>
            <MaterialCommunityIcons
              name="lock-reset"
              size={24}
              color={theme.primary}
            />
            <Text style={{ color: theme.primaryText }}>Change password</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.primary}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    linksContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      width: "100%",
      paddingHorizontal: 10,
      backgroundColor: theme.linksContainerBg,
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
      borderBottomColor: theme.greyBorder,
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
