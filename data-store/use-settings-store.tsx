import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type Theme = "system" | "light" | "dark";

interface SettingsState {
  locationEnabled: boolean;
  notificationsEnabled: boolean;
  theme: Theme;

  setLocation: (value: boolean) => void;
  setNotifications: (value: boolean) => void;
  setTheme: (value: Theme) => void;

  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locationEnabled: true,
  notificationsEnabled: true,
  theme: "system",

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

  hydrate: async () => {
    const location = await AsyncStorage.getItem("location");
    const notifications = await AsyncStorage.getItem("notifications");
    const theme = await AsyncStorage.getItem("theme");

    set({
      locationEnabled: location ? JSON.parse(location) : true,
      notificationsEnabled: notifications ? JSON.parse(notifications) : true,
      theme: (theme as Theme) || "system",
    });
  },
}));
