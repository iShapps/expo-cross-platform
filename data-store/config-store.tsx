import { IConfigData } from "@/data-types/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AccountStoreType {
  clearDetails: () => void;
  configSettings: IConfigData | null;
  setConfigSettings: (configSettings: IConfigData | null) => void;
}

export const useConfigSettings = create<AccountStoreType>()(
  persist(
    (set, get) => ({
      configSettings: null,
      setConfigSettings: (configSettings) => set({ configSettings }),
      clearDetails: () => set({ configSettings: null }),
    }),
    {
      name: "ishapps--config-settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
