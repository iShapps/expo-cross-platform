import { Palette } from "@/constants/design";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

interface SkeletonBaseProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBase: React.FC<SkeletonBaseProps> = ({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}) => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [shimmerAnim]);

  const palette = Palette[colorScheme === "dark" ? "dark" : "light"];
  const shimmerColors = [palette.skeleton, palette.skeletonHighlight];
  const backgroundColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: shimmerColors,
  });

  return (
    <Animated.View
      style={[
        getStyles(colorScheme).skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

const getStyles = (colorScheme: string) => StyleSheet.create({
  skeleton: {
    overflow: "hidden",
    backgroundColor: Palette[colorScheme === "dark" ? "dark" : "light"].skeleton,
  },
});
