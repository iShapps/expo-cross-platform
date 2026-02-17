import React from "react";

import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen name="[shiftId]" options={{ headerShown: false }} />
    </Stack>
  );
}
