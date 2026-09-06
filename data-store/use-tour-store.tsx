import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type TourKey =
  | "dashboard"
  | "shifts"
  | "shiftDetails"
  | "documents"
  | "myShifts"
  | "more"
  | "settings"
  | "login";

const TOUR_KEYS: TourKey[] = [
  "dashboard",
  "shifts",
  "shiftDetails",
  "documents",
  "myShifts",
  "more",
  "settings",
  "login",
];

const storageKey = (key: TourKey) => `tour_seen_${key}`;

interface TourState {
  seen: Record<TourKey, boolean>;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  markSeen: (key: TourKey) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useTourStore = create<TourState>((set) => ({
  seen: {
    dashboard: false,
    shifts: false,
    shiftDetails: false,
    documents: false,
    myShifts: false,
    more: false,
    settings: false,
    login: false,
  },
  hasHydrated: false,

  hydrate: async () => {
    try {
      const entries = await Promise.all(
        TOUR_KEYS.map(
          async (key) =>
            [key, (await AsyncStorage.getItem(storageKey(key))) === "true"] as const,
        ),
      );
      set({
        seen: Object.fromEntries(entries) as Record<TourKey, boolean>,
        hasHydrated: true,
      });
    } catch (error) {
      console.error("Failed to hydrate tour store:", error);
      set({ hasHydrated: true });
    }
  },

  markSeen: async (key) => {
    set((state) => ({ seen: { ...state.seen, [key]: true } }));
    try {
      await AsyncStorage.setItem(storageKey(key), "true");
    } catch (error) {
      console.error(`Failed to persist tour "${key}" as seen:`, error);
    }
  },

  resetAll: async () => {
    set({
      seen: {
        dashboard: false,
        shifts: false,
        shiftDetails: false,
        documents: false,
        myShifts: false,
        more: false,
        settings: false,
        login: false,
      },
    });
    try {
      await Promise.all(
        TOUR_KEYS.map((key) => AsyncStorage.removeItem(storageKey(key))),
      );
    } catch (error) {
      console.error("Failed to reset tour store:", error);
    }
  },
}));
