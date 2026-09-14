import { User } from "@/data-types/auth";
import { IShift } from "@/data-types/shifts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LastLocationUpdate {
  latitude: number;
  longitude: number;
  sentAt: number;
}

interface AccountStoreType {
  token: string | null;
  setToken: (token: string) => void;
  clearDetails: () => void;
  userDetails: User | null;
  setUserDetails: (userDetails: User | null) => void;
  acceptedShift: IShift | null;
  setAcceptedShift: (shift: IShift | null) => void;
  startDate: string | null;
  setStartDate: (date: string | null) => void;
  endDate: string | null;
  setEndDate: (date: string | null) => void;
  clearDateFilters: () => void;
  lastLocationUpdate: LastLocationUpdate | null;
  setLastLocationUpdate: (update: LastLocationUpdate | null) => void;
  activeTrackingIntervalMs: number | null;
  setActiveTrackingIntervalMs: (ms: number | null) => void;
}

export const useProfileData = create<AccountStoreType>()(
  persist(
    (set) => ({
      token: null,
      userDetails: null,
      acceptedShift: null,
      setAcceptedShift: (shift) =>
        set({
          acceptedShift: shift,
          lastLocationUpdate: null,
          activeTrackingIntervalMs: null,
        }),
      setUserDetails: (userDetails) => set({ userDetails }),
      setToken: (token) => set({ token: token }),
      clearDetails: () =>
        set({
          token: null,
          userDetails: null,
          acceptedShift: null,
          startDate: null,
          endDate: null,
          lastLocationUpdate: null,
          activeTrackingIntervalMs: null,
        }),
      startDate: null,
      setStartDate: (date) => set({ startDate: date }),
      endDate: null,
      setEndDate: (date) => set({ endDate: date }),
      clearDateFilters: () => set({ startDate: null, endDate: null }),
      lastLocationUpdate: null,
      setLastLocationUpdate: (update) => set({ lastLocationUpdate: update }),
      activeTrackingIntervalMs: null,
      setActiveTrackingIntervalMs: (ms) =>
        set({ activeTrackingIntervalMs: ms }),
    }),
    {
      name: "ishapps-account-data",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
