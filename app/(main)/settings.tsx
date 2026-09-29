import { sendTestNotification } from "@/api-actions/notifications";
import { useSession } from "@/app/ctx";
import {
  AppButton,
  AppSwitch,
  AppText,
  Icon,
  ListGroup,
  ListRow,
  ScreenHeader,
  SegmentedTabs,
} from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { useTourStore } from "@/data-store/use-tour-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useOneSignalSubscriptionStatus } from "@/hooks/use-one-signal";
import { useIsFocused } from "@react-navigation/native";
import * as Application from "expo-application";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";

const WalkthroughableView = walkthroughable(View);

const THEME_OPTIONS = ["light", "dark", "system"] as const;
const THEME_LABELS = ["Light", "Dark", "System"];

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { isChecking, isSetup, refresh } = useOneSignalSubscriptionStatus();
  const { retryNotificationSetup, user, signOut } = useSession();
  const [isRetryingNotifications, setIsRetryingNotifications] = useState(false);
  const [isTestingNotifications, setIsTestingNotifications] = useState(false);
  const hcp = user;

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

  const resetTours = useTourStore((state) => state.resetAll);

  const isFocused = useIsFocused();

  useFirstVisitTour("settings", isFocused);

  const appVersion = `${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`;

  const handleClearOrganization = () => {
    Alert.alert(
      "Clear organization? (Dev)",
      "This signs you out and forgets the currently stored organization, so you can retest the sign-in flow from scratch.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await signOut();
            useTenantStore.getState().clearTenant();
          },
        },
      ],
    );
  };

  const handleReplayTour = () => {
    Alert.alert(
      "Replay app tour",
      "This will show the guided tour again the next time you visit the Dashboard, Shifts, My Shifts, a shift's details, Documents, and More.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replay",
          onPress: async () => {
            await resetTours();
            router.push("/(tabs)");
          },
        },
      ],
    );
  };

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

  const pushNotSetUp = (!isChecking && !isSetup) || !hcp?.device_id;

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CopilotStep
          name="settings-overview"
          order={1}
          active={isFocused}
          text="Manage device permissions, theme, biometric login, and replay the app tour from here."
        >
          <WalkthroughableView style={styles.groups}>
            <ListGroup title="App permissions">
              <ListRow
                icon="location-outline"
                title="Location access"
                subtitle="Allow app to access your location for better experience."
                right={<AppSwitch value={locationEnabled} onValueChange={setLocation} />}
              />

              <ListRow
                icon="notifications-outline"
                title="Notifications"
                subtitle="Enable push notifications for important updates."
                right={<AppSwitch value={notificationsEnabled} onValueChange={setNotifications} />}
                isLast
              />
              <View style={[styles.rowExtra, { borderBottomColor: colors.border }]}>
                {pushNotSetUp && (
                  <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
                    <Icon name="alert-circle-outline" size={16} color={colors.danger} />
                    <AppText variant="footnote" color="danger" style={styles.flex}>
                      Push notifications are not set up on this device.
                    </AppText>
                  </View>
                )}
                <View style={styles.buttonRow}>
                  {pushNotSetUp && (
                    <AppButton
                      title="Retry setup"
                      icon="refresh"
                      variant="secondary"
                      size="compact"
                      onPress={handleRetryNotificationsSetup}
                      loading={isRetryingNotifications}
                      disabled={isRetryingNotifications}
                      style={styles.flex}
                    />
                  )}
                  <CopilotStep
                    name="settings-test-notification"
                    order={2}
                    active={isFocused}
                    text="Send yourself a test notification to confirm push notifications are actually reaching this device."
                  >
                    <WalkthroughableView style={styles.flex}>
                      <AppButton
                        title="Send test notification"
                        icon="paper-plane-outline"
                        variant="outline"
                        size="compact"
                        onPress={handleTestPushNotifications}
                        loading={isTestingNotifications}
                        disabled={isTestingNotifications}
                        fullWidth
                      />
                    </WalkthroughableView>
                  </CopilotStep>
                </View>
              </View>

              <ListRow
                icon="calendar-outline"
                title="Calendar & reminders"
                subtitle="Allow app to add shifts to your calendar with reminders."
                right={<AppSwitch value={calendarEnabled} onValueChange={setCalendar} />}
                isLast
              />
            </ListGroup>

            <ListGroup title="Appearance">
              <ListRow
                icon="contrast-outline"
                title="Theme"
                subtitle="Choose how the app looks."
                isLast
              />
              <View style={styles.rowExtraLast}>
                <SegmentedTabs
                  tabs={THEME_LABELS}
                  activeIndex={Math.max(0, THEME_OPTIONS.indexOf(theme))}
                  onTabPress={(index) => setTheme(THEME_OPTIONS[index])}
                />
              </View>
            </ListGroup>

            <ListGroup title="Security">
              <ListRow
                icon="finger-print-outline"
                title="Biometric authentication"
                subtitle="Enable biometric authentication for added security."
                right={<AppSwitch value={biometricsEnabled} onValueChange={setBiometrics} />}
                isLast
              />
            </ListGroup>

            {/* Dev-only: clear the persisted organization to retest sign-in */}
            {__DEV__ && (
              <ListGroup title="Developer">
                <ListRow
                  icon="trash-outline"
                  title="Clear organization (Dev)"
                  subtitle="Sign out and forget the stored organization to retest the sign-in flow from scratch."
                  destructive
                  onPress={handleClearOrganization}
                  isLast
                />
              </ListGroup>
            )}

            {/* Replay app tour */}
            {false && (
              <ListGroup>
                <ListRow
                  icon="school-outline"
                  title="Replay app tour"
                  subtitle="See the guided walkthrough of the dashboard, shifts, my shifts, documents, and more again."
                  onPress={handleReplayTour}
                  isLast
                />
              </ListGroup>
            )}
          </WalkthroughableView>
        </CopilotStep>

        {/* App Version Footer */}
        <AppText variant="caption" color="textTertiary" align="center" style={styles.version}>
          iShapps v{appVersion}
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: Space.xxl,
  },
  groups: {
    gap: Space.lg,
  },
  rowExtra: {
    paddingHorizontal: Space.md,
    paddingBottom: Space.md,
    gap: Space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowExtraLast: {
    paddingHorizontal: Space.md,
    paddingBottom: Space.md,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    padding: Space.sm,
    borderRadius: Radius.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Space.xs,
  },
  version: {
    marginTop: Space.xl,
  },
});
