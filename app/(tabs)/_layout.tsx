import { Icon, type IconName } from "@/components/design";
import { HapticTab } from "@/components/haptic-tab";
import { FontFamily, Palette } from "@/constants/design";
import { Radii } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useIsFetching } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FetchingSnakeBar = () => {
  const isFetching = useIsFetching({
    predicate: (query) => query.state.fetchStatus === "fetching",
  });

  const translateX = React.useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = React.useState(0);

  React.useEffect(() => {
    if (!isFetching || barWidth === 0) return;

    translateX.setValue(-120); //start off-screen left

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: barWidth + 120, //exit off-screen right
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
      translateX.setValue(0);
    };
  }, [isFetching, barWidth, translateX]);

  if (!isFetching) return null;

  return (
    <View
      pointerEvents="none"
      style={styles.fetchingBarWrap}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.fetchingSnake,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const tabIcon = (focusedName: IconName, name: IconName) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Icon size={24} name={focused ? focusedName : name} color={color} />;
  };

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  // iOS: translucent blurred bar floating over content (screens already pad
  // their lists for it). Android: solid bar.
  const tabBarStyle =
    Platform.OS === "ios"
      ? {
          position: "absolute" as const,
          backgroundColor: "transparent",
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        }
      : {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        };

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <>
            {Platform.OS === "ios" && (
              <BlurView
                intensity={80}
                tint={isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
                style={StyleSheet.absoluteFill}
              />
            )}
            <FetchingSnakeBar />
          </>
        ),
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: tabIcon("home", "home-outline"),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: "Shifts",
          tabBarIcon: tabIcon("briefcase", "briefcase-outline"),
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: "My Shifts",
          tabBarIcon: tabIcon("calendar", "calendar-outline"),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: tabIcon("document-text", "document-text-outline"),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: tabIcon(
            "ellipsis-horizontal-circle",
            "ellipsis-horizontal-circle-outline",
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fetchingBarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: "hidden",
  },
  fetchingSnake: {
    position: "absolute",
    top: 0,
    height: 2,
    width: 120,
    borderRadius: Radii.full,
    backgroundColor: Palette.light.primary,
    opacity: 0.9,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
});
