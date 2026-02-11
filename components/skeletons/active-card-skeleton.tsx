import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const ActiveCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.topContent}>
        <SkeletonBase width={120} height={22} borderRadius={999} />
        <SkeletonBase width={100} height={18} borderRadius={4} />
      </View>

      <SkeletonBase
        width="70%"
        height={17}
        borderRadius={4}
        style={styles.title}
      />
      <SkeletonBase
        width="50%"
        height={13}
        borderRadius={4}
        style={styles.subtitle}
      />

      <View style={styles.infoPill}>
        <SkeletonBase width={16} height={16} borderRadius={4} />
        <SkeletonBase width="75%" height={14} borderRadius={4} />
      </View>

      <View style={styles.addressPill}>
        <SkeletonBase width={16} height={16} borderRadius={4} />
        <SkeletonBase width="80%" height={14} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 10,
    gap: 5,
    marginTop: 10,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  topContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    marginTop: 4,
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 8,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  addressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
});
