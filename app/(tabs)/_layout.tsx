import { HapticTab } from "@/components/haptic-tab";
import {
  TabBarFAFiveWIcon,
  TabBarFeatherIcon,
  TabBarIMaterialIcon,
  TabBarOctIcon,
} from "@/components/ui/tab-bar-icon";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useOneSignal } from "@/hooks/use-one-signal";
import { useShiftWatcher } from "@/hooks/use-shift-watcher";
import { useIsFetching } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

const FetchingSnakeBar = () => {
  const isFetching = useIsFetching({
    predicate: (query) => query.state.fetchStatus === "fetching",
  });

  const translateX = React.useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = React.useState(0);

  useShiftWatcher();
  useOneSignal();
  useEffect(() => {
    useSettingsStore.getState().hydrate();
  }, []);

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
  }, [isFetching, barWidth]);

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

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const lightTabBar = {
    activeTint: "#70C601",
    inactiveTint: "#71797E",
    iosBar: StyleSheet.create({
      bar: {
        backgroundColor: "#F8FFF0",
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        borderTopColor: "#D3D3D3",
      },
    }),
    androidBar: StyleSheet.create({
      bar: {
        backgroundColor: "#F8FFF0",
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        borderTopColor: "#D3D3D3",
      },
    }),
  };
  const darkTabBar = {
    activeTint: "#70C601",
    inactiveTint: "#A0A4AB",
    iosBar: StyleSheet.create({
      bar: {
        backgroundColor: "#232A2E",
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        borderTopColor: "#36454F",
      },
    }),
    androidBar: StyleSheet.create({
      bar: {
        backgroundColor: "#232A2E",
        position: "absolute",
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
        justifyContent: "center",
        alignItems: "center",
        borderTopColor: "#36454F",
      },
    }),
  };
  const tabBarTheme = colorScheme === "dark" ? darkTabBar : lightTabBar;

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        tabBarActiveTintColor: tabBarTheme.activeTint,
        tabBarInactiveTintColor: tabBarTheme.inactiveTint,
        tabBarStyle:
          Platform.OS === "ios"
            ? tabBarTheme.iosBar.bar
            : tabBarTheme.androidBar.bar,
        tabBarBackground: () => <FetchingSnakeBar />,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarOctIcon size={22} name="home-fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: "Shifts",
          tabBarIcon: ({ color }) => (
            <TabBarFeatherIcon size={22} name="clock" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: "Schedules",
          tabBarIcon: ({ color }) => (
            <TabBarFAFiveWIcon size={22} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color }) => (
            <TabBarIMaterialIcon size={22} name="receipt" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <TabBarIMaterialIcon size={22} name="more-horiz" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iosTabBar: {
    backgroundColor: "#F8FFF0",
    // marginHorizontal:15,
    // marginVertical:15,
    position: "absolute",
    // paddingHorizontal:5,
    // paddingVertical:18,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    borderTopColor: "#D3D3D3",
  },
  androidTabBar: {
    backgroundColor: "#F8FFF0",
    // marginHorizontal:15,
    // marginVertical:15,
    position: "absolute",
    // paddingHorizontal:5,
    // paddingVertical:18,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    borderTopColor: "#D3D3D3",
  },
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
    borderRadius: 999,
    backgroundColor: "#70C601",
    opacity: 0.9,
  },
});
