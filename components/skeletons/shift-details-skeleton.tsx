import { Card, ScreenHeader } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBase } from "./skeleton-base";

/** Placeholder matching the shift details page. */
export const ShiftDetailsSkeleton: React.FC = () => {
  const router = useRouter();
  const { colors } = useAppTheme();

  const row = (labelWidth: number, valueWidth: number, key: string) => (
    <View key={key} style={styles.row}>
      <SkeletonBase width={labelWidth} height={13} borderRadius={Radius.xs} />
      <SkeletonBase width={valueWidth} height={15} borderRadius={Radius.xs} />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Shift details"
        onBack={() => router.canGoBack() && router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card radius={Radius.xl} padding={Space.lg} style={styles.gap}>
          <View style={styles.heroRow}>
            <SkeletonBase width={52} height={52} borderRadius={Radius.full} />
            <View style={styles.heroText}>
              <SkeletonBase width="70%" height={18} borderRadius={Radius.xs} />
              <SkeletonBase width="90%" height={13} borderRadius={Radius.xs} />
              <SkeletonBase width="40%" height={12} borderRadius={Radius.xs} />
            </View>
          </View>
          <View style={styles.chips}>
            <SkeletonBase width={80} height={24} borderRadius={Radius.full} />
            <SkeletonBase width={80} height={24} borderRadius={Radius.full} />
          </View>
        </Card>

        <Card radius={Radius.xl} padding={Space.lg} style={styles.gap}>
          <SkeletonBase width="60%" height={24} borderRadius={Radius.xs} />
          <SkeletonBase width="45%" height={16} borderRadius={Radius.xs} />
        </Card>

        <Card radius={Radius.xl} padding={Space.lg} style={styles.gap}>
          {[80, 110, 90, 120, 100].map((w, i) => row(70, w, `r${i}`))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Space.gutter,
    paddingTop: Space.xs,
    gap: Space.md,
  },
  gap: {
    gap: Space.sm,
  },
  heroRow: {
    flexDirection: "row",
    gap: Space.sm,
    alignItems: "center",
  },
  heroText: {
    flex: 1,
    gap: Space.xs,
  },
  chips: {
    flexDirection: "row",
    gap: Space.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Space.xs,
  },
});
