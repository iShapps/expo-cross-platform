import {
    authenticateWithBiometrics,
    isBiometricAllowed,
    isBiometricAvailable,
} from "@/utils/biometrics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";
import { OneSignal } from "react-native-onesignal";
import { create } from "zustand";

type Theme = "system" | "light" | "dark";

interface SettingsState {
  locationEnabled: boolean;
  notificationsEnabled: boolean;
  theme: Theme;
  biometricsEnabled: boolean;

  setLocation: (value: boolean) => void;
  setNotifications: (value: boolean) => void;
  setTheme: (value: Theme) => void;
  setBiometrics: (value: boolean) => void;
  hydrate: () => Promise<void>;
  checkPermissions: () => Promise<void>;
  openAppSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  locationEnabled: false,
  notificationsEnabled: false,
  biometricsEnabled: false,
  theme: "light",

  setLocation: async (value) => {
    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Location Permission Required",
            "Please enable location permissions in your device settings to use this feature.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => get().openAppSettings() },
            ],
          );
          set({ locationEnabled: false });
          await AsyncStorage.setItem("location", JSON.stringify(false));
          return;
        }

        set({ locationEnabled: true });
        await AsyncStorage.setItem("location", JSON.stringify(true));
      } else {
        set({ locationEnabled: false });
        await AsyncStorage.setItem("location", JSON.stringify(false));

        Alert.alert(
          "Location Disabled",
          "Location has been disabled in the app. To completely revoke permissions, please go to your device settings.",
          [
            { text: "OK", style: "default" },
            { text: "Open Settings", onPress: () => get().openAppSettings() },
          ],
        );
      }
    } catch (error) {
      console.error("Failed to set location permission:", error);
      set({ locationEnabled: false });
    }
  },

  setNotifications: async (value) => {
    try {
      if (value) {
        const permission =
          await OneSignal.Notifications.requestPermission(true);

        if (!permission) {
          Alert.alert(
            "Notification Permission Required",
            "Please enable notifications in your device settings to receive updates.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => get().openAppSettings() },
            ],
          );
          set({ notificationsEnabled: false });
          await AsyncStorage.setItem("notifications", JSON.stringify(false));
          return;
        }

        set({ notificationsEnabled: true });
        await AsyncStorage.setItem("notifications", JSON.stringify(true));
      } else {
        await OneSignal.User.pushSubscription.optOut();
        set({ notificationsEnabled: false });
        await AsyncStorage.setItem("notifications", JSON.stringify(false));

        Alert.alert(
          "Notifications Disabled",
          "Notifications have been disabled. To completely revoke permissions, please go to your device settings.",
          [
            { text: "OK", style: "default" },
            { text: "Open Settings", onPress: () => get().openAppSettings() },
          ],
        );
      }
    } catch (error) {
      console.error("Failed to set notification permission:", error);
      set({ notificationsEnabled: false });
    }
  },

  setTheme: async (value) => {
    await AsyncStorage.setItem("theme", value);
    set({ theme: value });
  },

  setBiometrics: async (value) => {
    try {
      if (value) {
        const hasHardware = await isBiometricAvailable();

        if (!hasHardware) {
          Alert.alert(
            "Biometrics Not Supported",
            "Your device doesn't support biometric authentication.",
            [{ text: "OK", style: "cancel" }],
          );
          set({ biometricsEnabled: false });
          await AsyncStorage.setItem("biometrics", JSON.stringify(false));
          return;
        }
        const isEnrolled = await isBiometricAllowed();

        if (!isEnrolled) {
          Alert.alert(
            "Biometrics Not Set Up",
            "Please set up biometrics on your device first.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => get().openAppSettings(),
              },
            ],
          );
          set({ biometricsEnabled: false });
          await AsyncStorage.setItem("biometrics", JSON.stringify(false));
          return;
        }

        const authenticated = await authenticateWithBiometrics(
          "Verify your identity to enable biometric login",
        );

        if (authenticated) {
          set({ biometricsEnabled: true });
          await AsyncStorage.setItem("biometrics", JSON.stringify(true));
        } else {
          set({ biometricsEnabled: false });
          await AsyncStorage.setItem("biometrics", JSON.stringify(false));

          Alert.alert(
            "Authentication Failed",
            "Biometric authentication failed. Please try again.",
            [{ text: "OK", style: "default" }],
          );
        }
      } else {
        const shouldAuthenticate = get().biometricsEnabled;

        if (shouldAuthenticate) {
          const authenticated = await authenticateWithBiometrics(
            "Verify your identity to disable biometric login",
          );

          if (!authenticated) {
            Alert.alert(
              "Authentication Required",
              "You must authenticate to disable biometric login.",
              [{ text: "OK", style: "default" }],
            );
            return;
          }
        }

        set({ biometricsEnabled: false });
        await AsyncStorage.setItem("biometrics", JSON.stringify(false));
      }
    } catch (error) {
      console.error("Failed to set biometrics:", error);
      set({ biometricsEnabled: false });
      await AsyncStorage.setItem("biometrics", JSON.stringify(false));

      Alert.alert(
        "Error",
        "An error occurred while setting up biometric authentication.",
        [{ text: "OK", style: "default" }],
      );
    }
  },

  // Check current device-level permissions and update local state

  checkPermissions: async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const locationGranted = locationStatus.status === "granted";

      const notificationPermission =
        await OneSignal.Notifications.getPermissionAsync();
      const hasSubscription =
        await OneSignal.User.pushSubscription.getIdAsync();
      const notificationsGranted =
        notificationPermission === true && !!hasSubscription;

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricsAvailable = hasHardware && isEnrolled;

      const storedLocation = await AsyncStorage.getItem("location");
      const storedNotifications = await AsyncStorage.getItem("notifications");
      const storedBiometrics = await AsyncStorage.getItem("biometrics");

      const wantedLocation = storedLocation
        ? JSON.parse(storedLocation)
        : false;
      const wantedNotifications = storedNotifications
        ? JSON.parse(storedNotifications)
        : false;
      const wantedBiometrics = storedBiometrics
        ? JSON.parse(storedBiometrics)
        : false;

      set({
        locationEnabled: locationGranted && wantedLocation,
        notificationsEnabled: notificationsGranted && wantedNotifications,
        biometricsEnabled: biometricsAvailable && wantedBiometrics,
      });

      if (wantedLocation && !locationGranted) {
        await AsyncStorage.setItem("location", JSON.stringify(false));
      }
      if (wantedNotifications && !notificationsGranted) {
        await AsyncStorage.setItem("notifications", JSON.stringify(false));
      }
      if (wantedBiometrics && !biometricsAvailable) {
        await AsyncStorage.setItem("biometrics", JSON.stringify(false));
      }
    } catch (error) {
      console.error("Failed to check permissions:", error);
    }
  },

  hydrate: async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const locationEnabled = locationStatus.status === "granted";

      const permission = await OneSignal.Notifications.getPermissionAsync();
      const hasSubscription =
        await OneSignal.User.pushSubscription.getIdAsync();

      const notificationsEnabled = permission === true && !!hasSubscription;

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricsEnabled = hasHardware && isEnrolled;

      const theme = (await AsyncStorage.getItem("theme")) as Theme | null;

      const storedLocation = await AsyncStorage.getItem("location");
      const storedBiometrics = await AsyncStorage.getItem("biometrics");

      set({
        locationEnabled: storedLocation
          ? JSON.parse(storedLocation)
          : locationEnabled,
        notificationsEnabled,
        biometricsEnabled: storedBiometrics
          ? JSON.parse(storedBiometrics)
          : biometricsEnabled,
        theme: theme || "light",
      });
    } catch (err) {
      console.error("Failed to hydrate settings store", err);
    }
  },
  openAppSettings: () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  },
}));
