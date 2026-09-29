import { EmptyState, ScreenHeader } from "@/components/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InterviewsScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Interviews" onBack={() => router.back()} />

      <View style={styles.body}>
        <EmptyState
          icon="calendar-clear-outline"
          title="No interviews yet"
          message="Interview invitations will show up here."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
});
