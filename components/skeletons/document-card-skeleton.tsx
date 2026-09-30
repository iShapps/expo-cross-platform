import { Card } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

/** Placeholder matching DocumentCard's layout. */
export const DocumentCardSkeleton: React.FC = () => (
  <Card radius={Radius.lg} padding={Space.md} style={styles.card}>
    <SkeletonBase width={48} height={48} borderRadius={Radius.full} />
    <View style={styles.info}>
      <SkeletonBase width="75%" height={16} borderRadius={Radius.xs} />
      <SkeletonBase width="45%" height={13} borderRadius={Radius.xs} />
      <View style={styles.chips}>
        <SkeletonBase width={70} height={22} borderRadius={Radius.full} />
        <SkeletonBase width={90} height={22} borderRadius={Radius.full} />
      </View>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: Space.sm,
  },
  info: {
    flex: 1,
    gap: Space.xs,
  },
  chips: {
    flexDirection: "row",
    gap: Space.xs,
    marginTop: Space.xxs,
  },
});
