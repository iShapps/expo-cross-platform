import React from "react";

import { Stack } from "expo-router";

export default function OpenLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      {/* <Stack.Screen name="reset-password" options={{ headerShown: false }} />*/}
    </Stack>
  );
}
