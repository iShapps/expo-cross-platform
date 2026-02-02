import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import {
  TabBarFAFiveWIcon,
  TabBarFeatherIcon,
  TabBarIcon,
  TabBarIMaterialIcon,
} from "@/components/ui/tab-bar-icon";
import { Platform, StyleSheet } from "react-native";

export default function TabLayout() {
  const colorScheme = "light"; //useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#70C601",
        tabBarInactiveTintColor: "#71797E",
        tabBarStyle:
          Platform.OS === "ios" ? styles.iosTabBar : styles.androidTabBar,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon size={22} name="home" color={color} />
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
          title: "My schedules",
          tabBarIcon: ({ color }) => (
            <TabBarFAFiveWIcon size={22} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timesheets"
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
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          href: null,
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
});
