import Header from "@/components/Header";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InterviewsScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <Header title="Interviews" onBack={() => router.back()} />

      <View style={styles.linksContainer}></View>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    linksContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      width: "100%",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      flex: 1,
      paddingHorizontal: 10,
    },
  });
