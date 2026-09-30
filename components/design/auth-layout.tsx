import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFocusEffect } from "@react-navigation/native";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, type ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./app-text";
import { GradientFill } from "./gradient-fill";

type Props = {
  title: string;
  subtitle?: string;
  /** Visual above the title (e.g. the organisation's logo on the password step). */
  identity?: ReactNode;
  /** Shown under the subtitle. */
  badge?: ReactNode;
  children: ReactNode;
};

const LOGO_HEIGHT = 41;
/** Length of the green → page fade under the logo. */
const FADE = 96;

/**
 * Sign-in flow layout: a brand-green band at the top holding the centred
 * white logo, fading softly into the page, then a large heading and the form
 * sitting directly on the page. Scrolls with the keyboard like the screens
 * it replaced.
 */
export function AuthLayout({
  title,
  subtitle,
  identity,
  badge,
  children,
}: Props) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle(isDark ? "light" : "dark");
    }, [isDark]),
  );

  // Brand green in both schemes; the fade ends in fully transparent brand
  // green (not white) so there's no grey band on either background.
  const brand = colors.gradient[0];
  // Extra room above the logo so it sits centred in the visible green
  // (the solid part plus the top of the fade), not hugging the status bar.
  const logoTop = insets.top + Space.xxl + Space.md;
  const solidHeight = logoTop + LOGO_HEIGHT + Space.lg;
  const bandHeight = solidHeight + FADE;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.surface }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        bounces={false}
      >
        <View
          style={[styles.band, { height: bandHeight, paddingTop: logoTop }]}
        >
          <GradientFill
            colors={[brand, brand, "rgba(112,198,1,0)"]}
            locations={[0, solidHeight / bandHeight, 1]}
            direction="vertical"
            underlay={false}
          />
          <Image
            source={require("@/assets/images/ishapps_green.png")}
            resizeMode="contain"
            accessibilityLabel="iShapps Workforce"
            style={[styles.logo, { tintColor: colors.onHero }]}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.heading}>
            {identity && <View style={styles.identity}>{identity}</View>}
            <AppText variant="title1" style={styles.title}>
              {title}
            </AppText>
            {subtitle && (
              <AppText variant="body" color="textSecondary">
                {subtitle}
              </AppText>
            )}
            {badge}
          </View>

          <View style={styles.form}>{children}</View>

          <View style={styles.spacer} />

          <AppText variant="caption" color="textTertiary" align="center">
            iShapps Workforce
          </AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  band: {
    alignItems: "center",
  },
  logo: {
    width: 130,
    height: LOGO_HEIGHT,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: Space.xl,
    // Starts in the last, near-white part of the fade.
    marginTop: -Space.lg,
  },
  heading: {
    gap: Space.xs,
  },
  identity: {
    marginBottom: Space.md,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  form: {
    marginTop: Space.xl,
  },
  spacer: {
    flexGrow: 1,
    minHeight: Space.xl,
  },
});
