import { User } from "@/data-types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AccountStoreType {
  token: string | null;
  setToken: (token: string) => void;
  clearDetails: () => void;
  userDetails: User | null;
  setUserDetails: (userDetails: User | null) => void;
}

export const useProfileData = create<AccountStoreType>()(
  persist(
    (set, get) => ({
      token: null,
      userDetails: null,
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
