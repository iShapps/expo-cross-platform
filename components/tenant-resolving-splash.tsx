import { Palette, Space, Type } from "@/constants/design";
import { useTenantStore } from "@/data-store/use-tenant-store";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from "react-native";

// Always light: this follows the native splash (white, in both schemes —
// app.json) so the hand-off doesn't flash.
const colors = Palette.light;

export function TenantResolvingSplash() {
  const organizationName = useTenantStore((state) => state.tenant?.name);
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0.75)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      delay: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.96,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.75,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("@/assets/images/ishapps_green.png")}
        resizeMode="contain"
        accessibilityLabel="iShapps"
        style={[styles.logo, { transform: [{ scale }], opacity }]}
      />

      <Animated.View style={[styles.status, { opacity: fadeIn }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.statusText} numberOfLines={2}>
          {organizationName ? `Connecting to ${organizationName}` : "Getting things ready"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 63,
  },
  status: {
    position: "absolute",
    bottom: 96,
    left: Space.xxl,
    right: Space.xxl,
    alignItems: "center",
    gap: Space.sm,
  },
  statusText: {
    ...Type.subhead,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
