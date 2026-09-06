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
    lightBorder: "#fff",
    greyBorder: "#F0F0F0",
    safeAreaBg: "#ffffff",
    errorBg: "#FFB2B2",
    errorTitle: "#111",
    errorSubtitle: "#4B5563",
    divider: "#f4f4f4",
    heroIconBg: "#EAF7D2",
    mutedText: "#FBF2F2",
    notificationFaint: "#FFFFFF4D",
    dashboardCardAvailable: {
      backgroundColor: "#F8FFF0",
      borderColor: "#5ba000",
    },
    dashboardCardScheduled: {
      backgroundColor: "#F8FFF0",
      borderColor: "#5ba000",
    },
    dashboardCardMy: {
      backgroundColor: "#F8FFF0",
      borderColor: "#5ba000",
    },
    dashboardCardUpcoming: {
      backgroundColor: "#FFF7E6",
      borderColor: "#5ba000",
    },
    linksContainerBg: "#fff",
    shadow: "#70C601",
    settingTitle: "#232A2E",
    skeletonBg: "#f5f5f5",
    activeBorder: "#d0e6a5",
    statusText: "#fff",
  },
  dark: {
    tint: tintColorDark,
    tabIconSelected: tintColorDark,
    white: "#fff",
    primary: "#70C601",
    shadow: "#000",
    safeAreaBg: "#232A2E",
    darkText: "#70C601",
    greyBorder: "#36454F",
    background: "#232A2E",
    activeText: "#70C601",
    danger: "#ff6f61",
    primaryText: "#fff",
    secondaryText: "#C4C4C4",
    tertiaryText: "#b0b8ca",
    whiteBackground: "#232A2E",
    grayBorder: "#FFD966",
    whiteText: "#70C601",
    divider: "#36454F",
    heroBg: "#232A2E",
    heroBorder: "#36454F",
    lightBorder: "#36454F",
    errorBg: "#FFD966",
    errorTitle: "#FFD966",
    errorSubtitle: "#FFD966",
    heroIconBg: "#36454F",
    mutedText: "#232A2E",
    notificationFaint: "#3434344D",
    dashboardCardAvailable: {
      backgroundColor: "#232A2E",
      borderColor: "#70C601",
    },
    dashboardCardScheduled: {
      backgroundColor: "#232A2E",
      borderColor: "#4A90E2",
    },
    dashboardCardMy: {
      backgroundColor: "#232A2E",
      borderColor: "#4A90E2",
    },
    dashboardCardUpcoming: {
      backgroundColor: "#232A2E",
      borderColor: "#FFD600",
    },
    linksContainerBg: "#232A2E",
    settingTitle: "#fff",
    skeletonBg: "#232A2E",
    activeBorder: "#36454F",
    statusText: "#a8a49f",
  },
};

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
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
