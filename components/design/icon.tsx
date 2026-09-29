import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

/**
 * The app's one icon set: Ionicons. Use `-outline` names by default and the
 * filled name for selected/active states (e.g. tab bar).
 */
export type IconName = ComponentProps<typeof Ionicons>["name"];

export function Icon(props: ComponentProps<typeof Ionicons>) {
  return <Ionicons size={22} {...props} />;
}
