import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const NotificationCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <SkeletonBase width={40} height={40} borderRadius={20} />
      </View>
      <View style={styles.content}>
        <SkeletonBase
          width="70%"
          height={14}
          borderRadius={4}
          style={styles.title}
        />
        <SkeletonBase
          width="100%"
          height={12}
          borderRadius={4}
          style={styles.message}
        />
        <SkeletonBase width="50%" height={11} borderRadius={4} />
      </View>
      <View style={styles.detailHint}>
        <SkeletonBase width={20} height={20} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 12,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    marginBottom: 4,
  },
  message: {
    marginBottom: 4,
  },
  detailHint: {
    alignSelf: "flex-start",
    marginLeft: 8,
    marginTop: 2,
  },
});
