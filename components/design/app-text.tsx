import { Type, type AppColors, type TypeVariant } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Text, type TextProps } from "react-native";

export type ColorToken = {
  [K in keyof AppColors]: AppColors[K] extends string ? K : never;
}[keyof AppColors];

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  /** A colour token name; defaults to `text`. */
  color?: ColorToken;
  align?: "left" | "center" | "right";
};

/** Text in the design system's type scale (Outfit). */
export function AppText({ variant = "body", color = "text", align, style, ...rest }: AppTextProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[Type[variant], { color: colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
