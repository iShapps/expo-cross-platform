/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    tint: tintColorLight,
    tabIconSelected: tintColorLight,
    white: "#fff",
    primary: "#70C601",
    background: "#70C601",
    activeText: "#70C601",
    danger: "#ff6f61",
    primaryText: "#000",
    darkText: "#111",
    secondaryText: "#667085",
    tertiaryText: "#111",
    whiteBackground: "#fff",
    grayBorder: "#D3D3D3",
    whiteText: "#fff",
    heroBg: "#F8FFF0",
    heroBorder: "#E6F0D8",
    errorBg: "#FFB2B2",
    errorTitle: "#111",
    errorSubtitle: "#4B5563",
    heroIconBg: "#EAF7D2",
    mutedText: "#FBF2F2",
  },
  dark: {
    tint: tintColorDark,
    tabIconSelected: tintColorDark,
    white: "#fff",
    primary: "#70C601",
    darkText: "#70C601",
    background: "#232A2E",
    activeText: "#FFD966",
    danger: "#ff6f61",
    primaryText: "#fff",
    secondaryText: "#C4C4C4",
    tertiaryText: "#b0b8ca",
    whiteBackground: "#232A2E",
    grayBorder: "#FFD966",
    whiteText: "#FFD966",
    heroBg: "#232A2E",
    heroBorder: "#36454F",
    errorBg: "#FFD966",
    errorTitle: "#FFD966",
    errorSubtitle: "#FFD966",
    heroIconBg: "#36454F",
    mutedText: "#232A2E",
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
