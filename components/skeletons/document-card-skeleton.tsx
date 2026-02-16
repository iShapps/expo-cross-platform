import React from "react";
import { StyleSheet, View } from "react-native";

export const DocumentCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.iconSkeleton} />
    <View style={styles.infoColumn}>
      <View style={styles.lineSmall} />
      <View style={styles.lineLargeRow}>
        <View style={styles.lineLarge} />
        <View style={styles.circleSkeleton} />
      </View>
      <View style={styles.lineSmallRow}>
        <View style={styles.lineSmall} />
        <View style={styles.dotSkeleton} />
        <View style={styles.lineSmall} />
      </View>
    </View>
    <View style={styles.moreIconSkeleton} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 5,
    borderColor: "#f1f1f1",
    borderWidth: 1,
    minHeight: 56,
  },
  iconSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ececec",
    marginRight: 16,
    marginLeft: 2,
  },
  infoColumn: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  lineSmall: {
    height: 10,
    width: 80,
    backgroundColor: "#ececec",
    borderRadius: 4,
    marginBottom: 6,
    marginLeft: 2,
  },
  lineLargeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  lineLarge: {
    height: 16,
    width: 120,
    backgroundColor: "#ececec",
    borderRadius: 4,
    marginRight: 8,
  },
  circleSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ececec",
  },
  lineSmallRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  dotSkeleton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ececec",
    marginHorizontal: 3,
    marginTop: -1,
  },
  moreIconSkeleton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ececec",
    marginLeft: 8,
    alignSelf: "flex-start",
  },
});
