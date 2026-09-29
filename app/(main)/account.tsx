import { ListGroup, ListRow, ScreenHeader } from "@/components/design";
import { Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScreenHeader title="Account" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <ListGroup>
          <ListRow
            icon="person-outline"
            title="My account"
            subtitle="Your personal, profession and address details"
            onPress={() => router.push("/(main)/profile")}
          />
          <ListRow
            icon="lock-closed-outline"
            title="Change password"
            onPress={() => router.push("/(main)/change-password")}
            isLast
          />
        </ListGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
  },
});
