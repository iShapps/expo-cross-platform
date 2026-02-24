import {
  authenticateWithBiometrics,
  isBiometricAvailable,
} from "@/utils/biometrics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as Location from "expo-location";
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
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locationEnabled: true,
  notificationsEnabled: true,
  biometricsEnabled: false,
  theme: "light",

  setLocation: async (value) => {
    await AsyncStorage.setItem("location", JSON.stringify(value));
    set({ locationEnabled: value });
  },

  setNotifications: async (value) => {
    await AsyncStorage.setItem("notifications", JSON.stringify(value));
    set({ notificationsEnabled: value });
  },

  setTheme: async (value) => {
    await AsyncStorage.setItem("theme", value);
    set({ theme: value });
  },

  setBiometrics: async (value) => {
    if (value) {
      const available = await isBiometricAvailable();
      if (!available) {
        set({ biometricsEnabled: false });
        await AsyncStorage.setItem("biometrics", JSON.stringify(false));
        return;
      }
      const authenticated =
        await authenticateWithBiometrics("Enable biometrics");
      set({ biometricsEnabled: authenticated });
      await AsyncStorage.setItem("biometrics", JSON.stringify(authenticated));
    } else {
      set({ biometricsEnabled: false });
      await AsyncStorage.setItem("biometrics", JSON.stringify(false));
    }
  },

  hydrate: async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const locationEnabled = locationStatus.status === "granted";

      const storedNotifications = await AsyncStorage.getItem("notifications");
      const notificationsEnabled = storedNotifications
        ? JSON.parse(storedNotifications)
        : false;

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
        notificationsEnabled: storedNotifications
          ? JSON.parse(storedNotifications)
          : notificationsEnabled,
        biometricsEnabled: storedBiometrics
          ? JSON.parse(storedBiometrics)
          : biometricsEnabled,
        theme: theme || "light",
      });
    } catch (err) {
      console.error("Failed to hydrate settings store", err);
    }
  },
}));
