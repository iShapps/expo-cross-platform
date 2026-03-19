import {
  authenticateWithBiometrics,
  isBiometricAllowed,
  isBiometricAvailable,
} from "@/utils/biometrics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import * as LocalAuthentication from "expo-local-authentication";
import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";
import { OneSignal } from "react-native-onesignal";
import { create } from "zustand";

type Theme = "system" | "light" | "dark";

interface SettingsState {
  locationEnabled: boolean;
  notificationsEnabled: boolean;
  calendarEnabled: boolean;
  theme: Theme;
  biometricsEnabled: boolean;

  setLocation: (value: boolean) => void;
  setNotifications: (value: boolean) => void;
  setCalendar: (value: boolean) => void;
  setTheme: (value: Theme) => void;
  setBiometrics: (value: boolean) => void;
  hydrate: () => Promise<void>;
  checkPermissions: () => Promise<void>;
  requestAllPermissionsOnLaunch: () => Promise<void>;
  openAppSettings: () => void;
}

let isCheckingPermissions = false;

const showPermissionDeniedAlert = (
  feature: string,
  description: string,
  openSettings: () => void,
) => {
  Alert.alert(
    `${feature} Permission Required`,
    `${description} Please enable it in your device settings.`,
    [
      { text: "Not Now", style: "cancel" },
      { text: "Open Settings", onPress: openSettings },
    ],
  );
};

const showFeatureDisabledAlert = (
  feature: string,
  openSettings: () => void,
) => {
  Alert.alert(
    `${feature} Disabled`,
    `${feature} has been turned off. To fully revoke access, go to your device settings.`,
    [
      { text: "OK", style: "default" },
      { text: "Open Settings", onPress: openSettings },
    ],
  );
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  locationEnabled: false,
  notificationsEnabled: false,
  calendarEnabled: false,
  biometricsEnabled: false,
  theme: "light",

  setLocation: async (value) => {
    try {
      if (value) {
        const { status: currentStatus } =
          await Location.getForegroundPermissionsAsync();

        if (currentStatus === "denied") {
          showPermissionDeniedAlert(
            "Location",
            "Location access was previously denied.",
            get().openAppSettings,
          );
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          showPermissionDeniedAlert(
            "Location",
            "Location is needed to verify your arrival at shift locations.",
            get().openAppSettings,
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
        showFeatureDisabledAlert("Location", get().openAppSettings);
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
          showPermissionDeniedAlert(
            "Notification",
            "Notifications are needed to alert you about upcoming shifts.",
            get().openAppSettings,
          );
          set({ notificationsEnabled: false });
          await AsyncStorage.setItem("notifications", JSON.stringify(false));
          return;
        }

        await OneSignal.User.pushSubscription.optIn();
        set({ notificationsEnabled: true });
        await AsyncStorage.setItem("notifications", JSON.stringify(true));
      } else {
        await OneSignal.User.pushSubscription.optOut();
        set({ notificationsEnabled: false });
        await AsyncStorage.setItem("notifications", JSON.stringify(false));
        showFeatureDisabledAlert("Notifications", get().openAppSettings);
      }
    } catch (error) {
      console.error("Failed to set notification permission:", error);
      set({ notificationsEnabled: false });
    }
  },

  setCalendar: async (value) => {
    try {
      if (value) {
        const { status: currentStatus } =
          await Calendar.getCalendarPermissionsAsync();

        if (currentStatus === "denied") {
          showPermissionDeniedAlert(
            "Calendar",
            "Calendar access was previously denied.",
            get().openAppSettings,
          );
          return;
        }

        if (Platform.OS === "ios") {
          const calendarResult =
            await Calendar.requestCalendarPermissionsAsync();

          if (calendarResult.status !== "granted") {
            showPermissionDeniedAlert(
              "Calendar",
              "Calendar access is needed to add your shifts automatically.",
              get().openAppSettings,
            );
            set({ calendarEnabled: false });
            await AsyncStorage.setItem("calendar", JSON.stringify(false));
            return;
          }

          const remindersResult =
            await Calendar.requestRemindersPermissionsAsync();

          if (remindersResult.status !== "granted") {
            showPermissionDeniedAlert(
              "Reminders",
              "Reminders access is required alongside calendar access on iOS.",
              get().openAppSettings,
            );
            set({ calendarEnabled: false });
            await AsyncStorage.setItem("calendar", JSON.stringify(false));
            return;
          }
        } else {
          const { status } = await Calendar.requestCalendarPermissionsAsync();

          if (status !== "granted") {
            showPermissionDeniedAlert(
              "Calendar",
              "Calendar access is needed to add your shifts automatically.",
              get().openAppSettings,
            );
            set({ calendarEnabled: false });
            await AsyncStorage.setItem("calendar", JSON.stringify(false));
            return;
          }
        }

        set({ calendarEnabled: true });
        await AsyncStorage.setItem("calendar", JSON.stringify(true));
      } else {
        set({ calendarEnabled: false });
        await AsyncStorage.setItem("calendar", JSON.stringify(false));
        showFeatureDisabledAlert("Calendar", get().openAppSettings);
      }
    } catch (error) {
      console.error("Failed to set calendar permission:", error);
      set({ calendarEnabled: false });
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
            [{ text: "OK" }],
          );
          set({ biometricsEnabled: false });
          await AsyncStorage.setItem("biometrics", JSON.stringify(false));
          return;
        }

        const isEnrolled = await isBiometricAllowed();

        if (!isEnrolled) {
          Alert.alert(
            "Biometrics Not Set Up",
            "Please set up Face ID or fingerprint in your device settings first.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: get().openAppSettings },
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
        }
      } else {
        if (get().biometricsEnabled) {
          const authenticated = await authenticateWithBiometrics(
            "Verify your identity to disable biometric login",
          );

          if (!authenticated) {
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
    }
  },

  checkPermissions: async () => {
    if (isCheckingPermissions) return;
    isCheckingPermissions = true;

    try {
      const [
        locationStatus,
        calendarStatus,
        notificationPermission,
        hasSubscription,
        hasHardware,
        isEnrolled,
        storedLocation,
        storedNotifications,
        storedCalendar,
        storedBiometrics,
      ] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Calendar.getCalendarPermissionsAsync(),
        OneSignal.Notifications.getPermissionAsync(),
        OneSignal.User.pushSubscription.getIdAsync(),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        AsyncStorage.getItem("location"),
        AsyncStorage.getItem("notifications"),
        AsyncStorage.getItem("calendar"),
        AsyncStorage.getItem("biometrics"),
      ]);

      const locationGranted = locationStatus.status === "granted";
      const calendarGranted = calendarStatus.status === "granted";
      const notificationsGranted =
        notificationPermission === true && !!hasSubscription;
      const biometricsAvailable = hasHardware && isEnrolled;

      const wantedLocation = storedLocation
        ? JSON.parse(storedLocation)
        : false;
      const wantedNotifications = storedNotifications
        ? JSON.parse(storedNotifications)
        : false;
      const wantedCalendar = storedCalendar
        ? JSON.parse(storedCalendar)
        : false;
      const wantedBiometrics = storedBiometrics
        ? JSON.parse(storedBiometrics)
        : false;

      const nextLocation = locationGranted && wantedLocation;
      const nextNotifications = notificationsGranted && wantedNotifications;
      const nextCalendar = calendarGranted && wantedCalendar;
      const nextBiometrics = biometricsAvailable && wantedBiometrics;

      const current = get();
      if (
        current.locationEnabled !== nextLocation ||
        current.notificationsEnabled !== nextNotifications ||
        current.calendarEnabled !== nextCalendar ||
        current.biometricsEnabled !== nextBiometrics
      ) {
        set({
          locationEnabled: nextLocation,
          notificationsEnabled: nextNotifications,
          calendarEnabled: nextCalendar,
          biometricsEnabled: nextBiometrics,
        });
      }

      await Promise.all([
        wantedLocation && !locationGranted
          ? AsyncStorage.setItem("location", JSON.stringify(false))
          : Promise.resolve(),
        wantedNotifications && !notificationsGranted
          ? AsyncStorage.setItem("notifications", JSON.stringify(false))
          : Promise.resolve(),
        wantedCalendar && !calendarGranted
          ? AsyncStorage.setItem("calendar", JSON.stringify(false))
          : Promise.resolve(),
        wantedBiometrics && !biometricsAvailable
          ? AsyncStorage.setItem("biometrics", JSON.stringify(false))
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Failed to check permissions:", error);
    } finally {
      isCheckingPermissions = false;
    }
  },

  hydrate: async () => {
    try {
      const [
        locationStatus,
        calendarStatus,
        notificationPermission,
        hasSubscription,
        hasHardware,
        isEnrolled,
        theme,
        storedLocation,
        storedCalendar,
        storedBiometrics,
        storedNotifications,
      ] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Calendar.getCalendarPermissionsAsync(),
        OneSignal.Notifications.getPermissionAsync(),
        OneSignal.User.pushSubscription.getIdAsync(),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        AsyncStorage.getItem("theme"),
        AsyncStorage.getItem("location"),
        AsyncStorage.getItem("calendar"),
        AsyncStorage.getItem("biometrics"),
        AsyncStorage.getItem("notifications"),
      ]);

      const locationGranted = locationStatus.status === "granted";
      const calendarGranted = calendarStatus.status === "granted";
      const notificationsActive =
        notificationPermission === true && !!hasSubscription;
      const biometricsAvailable = hasHardware && isEnrolled;

      set({
        locationEnabled:
          storedLocation !== null
            ? JSON.parse(storedLocation) && locationGranted
            : locationGranted,
        notificationsEnabled:
          storedNotifications !== null
            ? JSON.parse(storedNotifications) && notificationsActive
            : notificationsActive,
        calendarEnabled:
          storedCalendar !== null
            ? JSON.parse(storedCalendar) && calendarGranted
            : calendarGranted,
        biometricsEnabled:
          storedBiometrics !== null
            ? JSON.parse(storedBiometrics) && biometricsAvailable
            : biometricsAvailable,
        theme: (theme as Theme) || "light",
      });
    } catch (err) {
      console.error("Failed to hydrate settings store", err);
    }
  },

  requestAllPermissionsOnLaunch: async () => {
    try {
      // Request location permission
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locationStatus === "granted") {
        set({ locationEnabled: true });
        await AsyncStorage.setItem("location", JSON.stringify(true));
      }

      // Request notifications permission
      try {
        const notificationPermission =
          await OneSignal.Notifications.requestPermission(true);
        if (notificationPermission) {
          await OneSignal.User.pushSubscription.optIn();
          set({ notificationsEnabled: true });
          await AsyncStorage.setItem("notifications", JSON.stringify(true));
        }
      } catch (error) {
        console.error("Failed to request notification permission:", error);
      }

      // Request calendar permission
      if (Platform.OS === "ios") {
        const calendarResult = await Calendar.requestCalendarPermissionsAsync();

        if (calendarResult.status === "granted") {
          const remindersResult =
            await Calendar.requestRemindersPermissionsAsync();

          if (remindersResult.status === "granted") {
            set({ calendarEnabled: true });
            await AsyncStorage.setItem("calendar", JSON.stringify(true));
          }
        }
      } else {
        const { status: calendarStatus } =
          await Calendar.requestCalendarPermissionsAsync();

        if (calendarStatus === "granted") {
          set({ calendarEnabled: true });
          await AsyncStorage.setItem("calendar", JSON.stringify(true));
        }
      }

      // Request biometrics permission
      // const hasHardware = await isBiometricAvailable();
      // const isEnrolled = await isBiometricAllowed();

      // if (hasHardware && isEnrolled) {
      //   const authenticated = await authenticateWithBiometrics(
      //     "Verify your identity to enable biometric login",
      //   );

      //   if (authenticated) {
      //     set({ biometricsEnabled: true });
      //     await AsyncStorage.setItem("biometrics", JSON.stringify(true));
      //   }
      // }

      const storedBiometrics = await AsyncStorage.getItem("biometrics");
      const alreadyDecided = storedBiometrics !== null;

      if (!alreadyDecided) {
        const hasHardware = await isBiometricAvailable();
        const isEnrolled = await isBiometricAllowed();

        if (hasHardware && isEnrolled) {
          const authenticated = await authenticateWithBiometrics(
            "Verify your identity to enable biometric login",
          );

          if (authenticated) {
            set({ biometricsEnabled: true });
            await AsyncStorage.setItem("biometrics", JSON.stringify(true));
          } else {
            set({ biometricsEnabled: false });
            await AsyncStorage.setItem("biometrics", JSON.stringify(false));
          }
        } else {
          await AsyncStorage.setItem("biometrics", JSON.stringify(false));
        }
      }
    } catch (error) {
      console.error("Failed to request permissions on launch:", error);
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
