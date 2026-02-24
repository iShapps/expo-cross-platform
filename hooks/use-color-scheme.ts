import { useSettingsStore } from "@/data-store/use-settings-store";
import { useColorScheme as useNativeColorScheme } from "react-native";

export function useColorScheme() {
  const systemColorScheme = useNativeColorScheme();
  const theme = useSettingsStore((state) => state.theme);

  if (theme === "light") return "light";
  if (theme === "dark") return "dark";

  // theme === "system"
  return systemColorScheme ?? "light";
}
