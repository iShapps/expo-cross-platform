import { User } from "@/data-types/auth";
import { IShift } from "@/data-types/shifts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AccountStoreType {
  token: string | null;
  setToken: (token: string) => void;
  clearDetails: () => void;
  userDetails: User | null;
  setUserDetails: (userDetails: User | null) => void;
  acceptedShift: IShift | null;
  setAcceptedShift: (shift: IShift | null) => void;
}

export const useProfileData = create<AccountStoreType>()(
  persist(
    (set, get) => ({
      token: null,
      userDetails: null,
      acceptedShift: null,
      setAcceptedShift: (shift) => set({ acceptedShift: shift }),
      setUserDetails: (userDetails) => set({ userDetails }),
      setToken: (token) => set({ token: token }),
      clearDetails: () => set({ token: null }),
    }),
    {
      name: "ishapps-account-data",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
