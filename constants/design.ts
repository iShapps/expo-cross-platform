/**
 * iShapps design system — tokens for the redesigned UI.
 *
 * Mirrors the web admin panel (frontend/src/theme/index.ts): Outfit, the
 * #70C601 → #5AA000 brand gradient, a warm off-white canvas, navy text,
 * soft-shadowed rounded cards and pill buttons.
 *
 * Screens move onto these tokens one at a time. The older `Colors` table in
 * constants/theme.ts stays until every screen has been migrated.
 *
 * Rules:
 * - Colours: always a semantic token (`colors.textSecondary`), never a hex.
 * - Text: always a `Type` style (fontFamily carries the weight — don't set
 *   `fontWeight` on Outfit text, Android ignores it for custom fonts).
 * - Anything tappable is at least `Touch.min` (44pt, Apple HIG) tall/wide,
 *   or reaches it with `hitSlop`.
 */
import { Platform, type TextStyle, type ViewStyle } from "react-native";

// ─── Colour ────────────────────────────────────────────────────────────────

const light = {
  // Canvas & surfaces
  background: "#F5F7F2",
  surface: "#FFFFFF",
  surfaceMuted: "#EFF3EA",
  surfaceSunken: "#E8EDE1",
  border: "#E8EDE0",
  borderStrong: "#D3DBC7",

  // Text
  text: "#1A1A2E",
  textSecondary: "#5C6370",
  textTertiary: "#8B929C",
  textOnPrimary: "#FFFFFF",

  // Brand
  primary: "#70C601",
  primaryPressed: "#5AA000",
  primaryStrong: "#3F7A00", // brand-coloured text/icons on light surfaces
  primarySoft: "#E8F7CC",
  gradient: ["#70C601", "#5AA000"] as const,

  // Hero (the green header on Home)
  heroGradient: ["#74CA05", "#3F7A00"] as const,
  onHero: "#FFFFFF",
  onHeroMuted: "rgba(255,255,255,0.8)",
  heroGlass: "rgba(255,255,255,0.16)",
  heroGlassBorder: "rgba(255,255,255,0.28)",

  // Accents (stat tiles, categories)
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  blue: "#2563EB",
  blueSoft: "#DBEAFE",
  violet: "#7C3AED",
  violetSoft: "#EDE9FE",

  // Status
  success: "#2E7D32",
  successSoft: "#E3F4E4",
  warning: "#B45309",
  warningSoft: "#FFF4E0",
  danger: "#D32F2F",
  dangerSoft: "#FDECEC",
  info: "#0277BD",
  infoSoft: "#E1F3FB",

  // Chrome
  tabBar: "#FFFFFF",
  tabInactive: "#8B929C",
  overlay: "rgba(10,14,12,0.45)",
  skeleton: "#E8EDE1",
  skeletonHighlight: "#F3F6EF",
  shadow: "#1A2A10",
};

type Gradient = readonly [string, string];

export type AppColors = Omit<typeof light, "gradient" | "heroGradient"> & {
  gradient: Gradient;
  heroGradient: Gradient;
};

const dark: AppColors = {
  background: "#0D110F",
  surface: "#161B18",
  surfaceMuted: "#1E2521",
  surfaceSunken: "#111512",
  border: "#252D28",
  borderStrong: "#34403A",

  text: "#EEF2EA",
  textSecondary: "#A3ADA5",
  textTertiary: "#6F7A72",
  textOnPrimary: "#FFFFFF",

  primary: "#7FD41A",
  primaryPressed: "#6BBE00",
  primaryStrong: "#A3E35A",
  primarySoft: "rgba(127,212,26,0.14)",
  gradient: ["#70C601", "#4E8E00"],

  heroGradient: ["#2F5A04", "#15280A"],
  onHero: "#FFFFFF",
  onHeroMuted: "rgba(255,255,255,0.72)",
  heroGlass: "rgba(255,255,255,0.08)",
  heroGlassBorder: "rgba(255,255,255,0.14)",

  amber: "#FBBF24",
  amberSoft: "rgba(251,191,36,0.14)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.14)",
  violet: "#A78BFA",
  violetSoft: "rgba(167,139,250,0.14)",

  success: "#4ADE80",
  successSoft: "rgba(74,222,128,0.14)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.12)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.14)",
  info: "#38BDF8",
  infoSoft: "rgba(56,189,248,0.14)",

  tabBar: "#131815",
  tabInactive: "#6F7A72",
  overlay: "rgba(0,0,0,0.6)",
  skeleton: "#1E2521",
  skeletonHighlight: "#28312C",
  shadow: "#000000",
};

export const Palette: Record<"light" | "dark", AppColors> = { light, dark };

/** Tones shared by chips, icon badges and stat tiles. */
export type Tone = "primary" | "amber" | "blue" | "violet" | "success" | "warning" | "danger" | "info" | "neutral";

export function toneColors(colors: AppColors, tone: Tone): { fg: string; bg: string } {
  switch (tone) {
    case "primary":
      return { fg: colors.primaryStrong, bg: colors.primarySoft };
    case "amber":
      return { fg: colors.amber, bg: colors.amberSoft };
    case "blue":
      return { fg: colors.blue, bg: colors.blueSoft };
    case "violet":
      return { fg: colors.violet, bg: colors.violetSoft };
    case "success":
      return { fg: colors.success, bg: colors.successSoft };
    case "warning":
      return { fg: colors.warning, bg: colors.warningSoft };
    case "danger":
      return { fg: colors.danger, bg: colors.dangerSoft };
    case "info":
      return { fg: colors.info, bg: colors.infoSoft };
    default:
      return { fg: colors.textSecondary, bg: colors.surfaceMuted };
  }
}

// ─── Shape & spacing ───────────────────────────────────────────────────────

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

export const Space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  /** Horizontal page gutter. */
  gutter: 20,
} as const;

/** Apple HIG: 44×44pt minimum hit target. */
export const Touch = {
  min: 44,
  button: 52,
  buttonCompact: 44,
} as const;

// ─── Type ──────────────────────────────────────────────────────────────────

/** Loaded in app/_layout.tsx via @expo-google-fonts/outfit. */
export const FontFamily = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  extrabold: "Outfit_800ExtraBold",
} as const;

const t = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing = 0): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
});

export const Type = {
  /** Big numbers (stat tiles, amounts). */
  display: t(FontFamily.bold, 34, 40, -0.8),
  title1: t(FontFamily.bold, 28, 34, -0.5),
  title2: t(FontFamily.semibold, 22, 28, -0.3),
  title3: t(FontFamily.semibold, 18, 24, -0.2),
  headline: t(FontFamily.semibold, 16, 22),
  body: t(FontFamily.regular, 16, 22),
  bodyMedium: t(FontFamily.medium, 16, 22),
  callout: t(FontFamily.regular, 15, 21),
  subhead: t(FontFamily.medium, 14, 20),
  footnote: t(FontFamily.regular, 13, 18),
  caption: t(FontFamily.medium, 12, 16),
  /** Small uppercase section labels. */
  overline: { ...t(FontFamily.semibold, 11, 14, 1), textTransform: "uppercase" } as TextStyle,
  button: t(FontFamily.semibold, 16, 20, 0.2),
  buttonCompact: t(FontFamily.semibold, 14, 18, 0.2),
} as const;

export type TypeVariant = keyof typeof Type;

// ─── Elevation ─────────────────────────────────────────────────────────────

/**
 * Soft, wide card shadow in light mode. Dark mode relies on surface contrast
 * and a hairline border instead — shadows don't read on dark backgrounds.
 */
export function elevation(colors: AppColors, isDark: boolean, level: 1 | 2 = 1): ViewStyle {
  if (isDark) return {};
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: level === 1 ? 4 : 10 },
      shadowOpacity: level === 1 ? 0.06 : 0.1,
      shadowRadius: level === 1 ? 12 : 24,
    },
    default: { elevation: level === 1 ? 2 : 6 },
  }) as ViewStyle;
}
