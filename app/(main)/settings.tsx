import Header from "@/components/Header";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Application from "expo-application";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  // State for toggles
  const {
    setTheme,
    theme,
    locationEnabled,
    setLocation,
    notificationsEnabled,
    setNotifications,

    biometricsEnabled,
    setBiometrics,
  } = useSettingsStore();

  const appVersion = `${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <Header title="Settings" onBack={() => router.back()} />
      <View style={{ flex: 1 }}>
        <View style={styles.linksContainer}>
          <Text style={styles.sectionHeader}>App permissions</Text>
          <View style={styles.settingsWrap}>
            {/* Location Access */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="location-sharp"
                  size={22}
                  color={colorScheme === "dark" ? "#FFD966" : "#70C601"}
                />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Location Access</Text>
                <Text style={styles.settingDesc}>
                  Allow app to access your location for better experience.
                </Text>
              </View>
              <Switch
                value={locationEnabled}
                onValueChange={setLocation}
                thumbColor={locationEnabled ? "#fff" : "#fff"}
                trackColor={{ false: "gray", true: "#70C601" }}
              />
            </View>

            {/* Notifications */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="notifications"
                  size={22}
                  color={colorScheme === "dark" ? "#FFD966" : "#70C601"}
                />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDesc}>
                  Enable push notifications for important updates.
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotifications}
                thumbColor={notificationsEnabled ? "#fff" : "#fff"}
                trackColor={{ false: "gray", true: "#70C601" }}
              />
            </View>

            {/* Theme */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <MaterialCommunityIcons
                  name="theme-light-dark"
                  size={22}
                  color={colorScheme === "dark" ? "#FFD966" : "#70C601"}
                />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Theme</Text>
                <Text style={styles.settingDesc}>
                  Toggle between Light, Dark, theme for the app.
                </Text>
              </View>
              <Switch
                value={theme === "dark"}
                onValueChange={(value) => setTheme(value ? "dark" : "light")}
                thumbColor={theme === "dark" ? "#fff" : "#fff"}
                trackColor={{
                  false: "gray",
                  true: "#70C601",
                }}
              />
            </View>

            {/* Biometrics */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="finger-print"
                  size={22}
                  color={colorScheme === "dark" ? "#FFD966" : "#70C601"}
                />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>
                  Biometric Authentication
                </Text>
                <Text style={styles.settingDesc}>
                  Enable biometric authentication for added security.
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometrics}
                thumbColor={biometricsEnabled ? "#fff" : "#fff"}
                trackColor={{ false: "gray", true: "#70C601" }}
              />
            </View>
          </View>
        </View>
        {/* App Version Footer */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v{appVersion}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    linksContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 24,
      shadowColor: colorScheme === "dark" ? "#000" : "#70C601",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    sectionHeader: {
      fontSize: 15,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#b0b8ca" : "#232A2E",
      marginLeft: 2,
    },
    settingsWrap: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      width: "100%",
      marginVertical: 5,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#f0f0f0",
      borderRadius: 5,
    },
    settingCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      borderRadius: 5,
      padding: 10,
      marginBottom: 2,
      shadowColor: colorScheme === "dark" ? "#000" : "#70C601",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
      gap: 12,
      borderBottomWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#f0f0f0",
    },
    settingIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 50,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#eafbe7",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    settingTextWrap: {
      flex: 1,
      flexDirection: "column",
      gap: 2,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#fff" : "#232A2E",
    },
    settingDesc: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#b0b8ca" : "#6b7280",
    },
    versionContainer: {
      alignItems: "center",
      paddingVertical: 16,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
    },

    versionText: {
      fontSize: 12,
      color: colorScheme === "dark" ? "#b0b8ca" : "#9ca3af",
    },
  });
