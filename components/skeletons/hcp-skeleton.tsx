import { Card } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

/** Placeholder matching a transfer-shift HCP row. */
const HcpListSkeleton = () => (
  <Card radius={Radius.lg} padding={Space.sm} style={styles.row}>
    <SkeletonBase width={44} height={44} borderRadius={Radius.full} />
    <View style={styles.textBlock}>
      <SkeletonBase width="60%" height={16} borderRadius={Radius.xs} />
      <SkeletonBase width="45%" height={13} borderRadius={Radius.xs} />
    </View>
    <SkeletonBase width={24} height={24} borderRadius={Radius.full} />
  </Card>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  textBlock: {
    flex: 1,
    gap: Space.xs,
  },
});

export default HcpListSkeleton;
