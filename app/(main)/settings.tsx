import Header from "@/components/Header";
import { Colors } from "@/constants/theme";
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
  const appTheme = Colors[colorScheme];
  const styles = getStyles(appTheme);

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
                  color={appTheme.activeText}
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
                thumbColor={appTheme.white}
                trackColor={{ false: "gray", true: appTheme.primary }}
              />
            </View>

            {/* Notifications */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="notifications"
                  size={22}
                  color={appTheme.activeText}
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
                thumbColor={appTheme.white}
                trackColor={{ false: "gray", true: appTheme.primary }}
              />
            </View>

            {/* Theme */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <MaterialCommunityIcons
                  name="theme-light-dark"
                  size={22}
                  color={appTheme.activeText}
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
                thumbColor={appTheme.white}
                trackColor={{
                  false: "gray",
                  true: appTheme.primary,
                }}
              />
            </View>

            {/* Biometrics */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="finger-print"
                  size={22}
                  color={appTheme.activeText}
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
                thumbColor={appTheme.white}
                trackColor={{ false: "gray", true: appTheme.primary }}
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

const getStyles = (appTheme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: appTheme.background,
    },
    linksContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      backgroundColor: appTheme.whiteBackground,
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 24,
      shadowColor: appTheme.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    sectionHeader: {
      fontSize: 15,
      fontWeight: "700",
      color: appTheme.tertiaryText,
      marginLeft: 2,
    },
    settingsWrap: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      width: "100%",
      marginVertical: 5,
      backgroundColor: appTheme.whiteBackground,
      borderWidth: 1,
      borderColor: appTheme.divider,
      borderRadius: 5,
    },
    settingCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: appTheme.whiteBackground,
      borderRadius: 5,
      padding: 10,
      marginBottom: 2,
      shadowColor: appTheme.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
      gap: 12,
      borderBottomWidth: 1,
      borderColor: appTheme.greyBorder,
    },
    settingIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 50,
      backgroundColor: appTheme.heroBg,
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
      color: appTheme.settingTitle,
    },
    settingDesc: {
      fontSize: 12,
      color: appTheme.secondaryText,
    },
    versionContainer: {
      alignItems: "center",
      paddingVertical: 16,
      backgroundColor: appTheme.whiteBackground,
    },

    versionText: {
      fontSize: 12,
      color: appTheme.secondaryText,
    },
  });
