import { elevation, Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Pressable, View, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

type CardStyleProps = {
  /** Inner padding; defaults to 16. */
  padding?: number;
  radius?: number;
  raised?: boolean;
};

function useCardStyle({ padding = Space.md, radius = Radius.xl, raised = false }: CardStyleProps): ViewStyle {
  const { colors, isDark } = useAppTheme();
  return {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding,
    ...elevation(colors, isDark, raised ? 2 : 1),
  };
}

/** Rounded surface card (24pt corners, hairline border, soft shadow in light mode). */
export function Card({ padding, radius, raised, style, ...rest }: ViewProps & CardStyleProps) {
  const cardStyle = useCardStyle({ padding, radius, raised });
  return <View style={[cardStyle, style]} {...rest} />;
}

/** A Card that is itself the tap target. */
export function PressableCard({
  padding,
  radius,
  raised,
  style,
  ...rest
}: Omit<PressableProps, "style"> & CardStyleProps & { style?: StyleProp<ViewStyle> }) {
  const cardStyle = useCardStyle({ padding, radius, raised });
  return (
    <Pressable
      style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}
      {...rest}
    />
  );
}
