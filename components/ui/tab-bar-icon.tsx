import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";

import { type ComponentProps } from "react";

export function TabBarIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof Ionicons>["name"]>) {
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}

export function TabBarFAIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof MaterialCommunityIcons>["name"]>) {
  return (
    <MaterialCommunityIcons
      size={28}
      style={[{ marginBottom: -3 }, style]}
      {...rest}
    />
  );
}

export function TabBarFAWIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof FontAwesome>["name"]>) {
  return (
    <FontAwesome size={28} style={[{ marginBottom: -3 }, style]} {...rest} />
  );
}

export function TabBarFeatherIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof Feather>["name"]>) {
  return <Feather size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}

export function TabBarIMaterialIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof MaterialIcons>["name"]>) {
  return (
    <MaterialIcons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />
  );
}

export function TabBarFAFiveWIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof FontAwesome5>["name"]>) {
  return (
    <FontAwesome5 size={28} style={[{ marginBottom: -3 }, style]} {...rest} />
  );
}

export function TabBarOctIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof Octicons>["name"]>) {
  return <Octicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}
