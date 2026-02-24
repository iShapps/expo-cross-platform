/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    card: "#F8FFF0",
    cardBorder: "#E6F0D8",
    error: "#FFB2B2",
    errorBg: "#FBF2F2",
    secondary: "#70C601",
    subtitle: "#6B7280",
    muted: "#818589",
    highlight: "#FFF7E6",
    warning: "#FFD600",
    success: "#28A745",
    info: "#4A90E2",
    surface: "#F0F0F0",
    border: "#D3D3D3",
    button: "#70C601",
    buttonText: "#fff",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    card: "#232A2E",
    cardBorder: "#36454F",
    error: "#E55353",
    errorBg: "#2D1A1A",
    secondary: "#70C601",
    subtitle: "#A0A4AB",
    muted: "#818589",
    highlight: "#2E2E2E",
    warning: "#FFD600",
    success: "#28A745",
    info: "#4A90E2",
    surface: "#232A2E",
    border: "#36454F",
    button: "#70C601",
    buttonText: "#fff",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
