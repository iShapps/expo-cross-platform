import { useIsFetching } from "@tanstack/react-query";
import React from "react";
import { StyleSheet, View } from "react-native";

interface GlobalFetchingBarProps {
  height?: number;
  color?: string;
  topOffset?: number;
  bottomOffset?: number;
  zIndex?: number;
}

export const GlobalFetchingBar: React.FC<GlobalFetchingBarProps> = ({
  height = 2,
  color = "#70C601",
  topOffset = 0,
  bottomOffset,
  zIndex = 9999,
}) => {
  //   const isFetching = useIsFetching();
  const isFetching = useIsFetching({
    predicate: (query) => query.state.fetchStatus === "fetching",
  });

  if (!isFetching) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.bar,
        {
          height,
          backgroundColor: color,
          zIndex,
          ...(bottomOffset !== undefined
            ? { bottom: bottomOffset }
            : { top: topOffset }),
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
