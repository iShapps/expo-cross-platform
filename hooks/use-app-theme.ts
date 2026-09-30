import { Palette, type AppColors } from "@/constants/design";
import { useColorScheme } from "@/hooks/use-color-scheme";

/** Design-system colours for the current scheme (honours the in-app light/dark/system setting). */
export function useAppTheme(): { colors: AppColors; isDark: boolean; scheme: "light" | "dark" } {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return { colors: Palette[scheme], isDark: scheme === "dark", scheme };
}
