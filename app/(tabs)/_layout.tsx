import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import {
  TabBarFAFiveWIcon,
  TabBarFeatherIcon,
  TabBarIMaterialIcon,
  TabBarOctIcon,
} from "@/components/ui/tab-bar-icon";
import { Platform, StyleSheet } from "react-native";

export default function TabLayout() {
  // const colorScheme = "light"; //useColorScheme();

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
            <TabBarOctIcon size={22} name="home-fill" color={color} />
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
        name="shifts"
        options={{
          title: "Shifts",
          tabBarIcon: ({ color }) => (
            <TabBarFeatherIcon size={22} name="clock" color={color} />
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
      <Tabs.Screen
        name="notifications"
        options={{
          headerShown: false,
          title: "Notifications",
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          href: null,
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          headerShown: false,
          title: "Change Password",
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          headerShown: false,
          title: "Account",
          href: null,
        }}
      />
      <Tabs.Screen
        name="interviews"
        options={{
          headerShown: false,
          title: "Interviews",
          href: null,
        }}
      />
      <Tabs.Screen
        name="facilities"
        options={{
          headerShown: false,
          title: "Facilities",
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: "Settings",
          href: null,
        }}
      />
      <Tabs.Screen
        name="shift-details"
        options={{
          headerShown: false,
          title: "Shift Details",
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
