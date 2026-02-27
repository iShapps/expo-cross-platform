import React from "react";

import { usePermissionMonitor } from "@/hooks/use-permission-monitor";
import { Stack } from "expo-router";

export default function OpenLayout() {
  usePermissionMonitor();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
    </Stack>
  );
}
