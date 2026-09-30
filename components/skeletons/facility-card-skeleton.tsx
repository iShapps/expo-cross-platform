import { Card } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

/** Placeholder matching FacilityCard's layout. */
const FacilityCardSkeleton: React.FC = () => (
  <Card radius={Radius.lg} padding={Space.md} style={styles.card}>
    <SkeletonBase width={48} height={48} borderRadius={Radius.full} />
    <View style={styles.content}>
      <SkeletonBase width="60%" height={16} borderRadius={Radius.xs} />
      <SkeletonBase width="85%" height={13} borderRadius={Radius.xs} />
      <SkeletonBase width="35%" height={13} borderRadius={Radius.xs} />
    </View>
  </Card>
);

export default FacilityCardSkeleton;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: Space.sm,
  },
  content: {
    flex: 1,
    gap: Space.xs,
  },
});
