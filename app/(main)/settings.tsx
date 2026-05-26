import { sendTestNotification } from "@/api-actions/notifications";
import { useSession } from "@/app/ctx";
import Header from "@/components/Header";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useOneSignalSubscriptionStatus } from "@/hooks/use-one-signal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Application from "expo-application";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const appTheme = Colors[colorScheme];
  const styles = getStyles(appTheme);
  const { isChecking, isSetup, refresh } = useOneSignalSubscriptionStatus();
  const { retryNotificationSetup, user } = useSession();
  const [isRetryingNotifications, setIsRetryingNotifications] = useState(false);
  const [isTestingNotifications, setIsTestingNotifications] = useState(false);

  // State for toggles
  const {
    setTheme,
    theme,
    locationEnabled,
    setLocation,
    notificationsEnabled,
    setNotifications,
    calendarEnabled,
    setCalendar,
    biometricsEnabled,
    setBiometrics,
  } = useSettingsStore();

  const appVersion = `${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`;

  const handleRetryNotificationsSetup = async () => {
    setIsRetryingNotifications(true);

    try {
      const didSetup = await retryNotificationSetup();
      await refresh();

      if (!didSetup) {
        Alert.alert(
          "Notifications Setup Failed",
          "We couldn't register this device for push notifications. Please allow notifications and try again.",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Failed to retry notification setup:", error);
      Alert.alert(
        "Notifications Setup Failed",
        "We couldn't register this device for push notifications. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsRetryingNotifications(false);
    }
  };

  const handleTestPushNotifications = async () => {
    const hcpId = user?.hcp?.id;

    if (!hcpId) {
      Alert.alert(
        "Test Notification Failed",
        "We couldn't find your HCP profile details. Please sign in again and try later.",
        [{ text: "OK" }],
      );
      return;
    }

    setIsTestingNotifications(true);

    try {
      const response = await sendTestNotification(hcpId);
      Alert.alert(
        "Test Notification Sent",
        response.message || "A test push notification has been sent.",
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Failed to send test push notification:", error);
      Alert.alert(
        "Test Notification Failed",
        error instanceof Error
          ? error.message
          : "We couldn't send a test push notification. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsTestingNotifications(false);
    }
  };

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
            <View style={styles.settingCardMain}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
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

              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {!isChecking && !isSetup && (
                  <Text style={styles.settingError}>
                    Push notifications are not set up on this device.
                  </Text>
                )}
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    gap: 10,
                  }}
                >
                  {!isChecking && !isSetup && (
                    <Pressable
                      onPress={handleRetryNotificationsSetup}
                      disabled={isRetryingNotifications}
                      style={({ pressed }) => [
                        styles.retryButton,
                        pressed && styles.retryButtonPressed,
                        isRetryingNotifications && styles.retryButtonDisabled,
                      ]}
                    >
                      {isRetryingNotifications ? (
                        <ActivityIndicator
                          size="small"
                          color={appTheme.white}
                        />
                      ) : (
                        <Text style={styles.retryButtonText}>
                          Retry notifications setup
                        </Text>
                      )}
                    </Pressable>
                  )}
                  <Pressable
                    onPress={handleTestPushNotifications}
                    disabled={isTestingNotifications}
                    style={({ pressed }) => [
                      styles.retryButton,
                      pressed && styles.retryButtonPressed,
                      isTestingNotifications && styles.retryButtonDisabled,
                    ]}
                  >
                    {isTestingNotifications ? (
                      <ActivityIndicator size="small" color={appTheme.white} />
                    ) : (
                      <Text style={styles.retryButtonText}>
                        Test push notifications
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Calendar & Reminders */}
            <View style={styles.settingCard}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="calendar"
                  size={22}
                  color={appTheme.activeText}
                />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Calendar & Reminders</Text>
                <Text style={styles.settingDesc}>
                  Allow app to add shifts to your calendar with reminders.
                </Text>
              </View>
              <Switch
                value={calendarEnabled}
                onValueChange={setCalendar}
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
                  Toggle between Light and Dark theme for the app.
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
    settingCardMain: {
      flexDirection: "column",
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
    settingError: {
      fontSize: 11,
      color: appTheme.danger,
      fontWeight: "400",
      marginTop: 2,
    },
    notificationSetupWrap: {
      gap: 8,
      marginTop: 2,
      alignItems: "flex-start",
    },
    retryButton: {
      minHeight: 34,
      paddingHorizontal: 12,
      borderRadius: 5,
      backgroundColor: appTheme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    retryButtonPressed: {
      opacity: 0.82,
    },
    retryButtonDisabled: {
      opacity: 0.65,
    },
    retryButtonText: {
      fontSize: 12,
      fontWeight: "400",
      color: appTheme.white,
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
