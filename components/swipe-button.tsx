import { GradientFill } from "@/components/design";
import { elevation, Radius, toneColors, Touch, Type } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface SwipeButtonProps {
  text: string;
  onSwipeComplete: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger";
  icon?: string;
  completed?: boolean;
  processing?: boolean;
}

export const SwipeButton = ({
  text,
  onSwipeComplete,
  disabled,
  tone = "primary",
  icon = "chevron-forward",
  completed = false,
  processing = false,
}: SwipeButtonProps) => {
  const { colors, isDark } = useAppTheme();
  const isPrimary = tone === "primary";
  const fillColor = isPrimary ? colors.gradient[0] : colors.danger;
  const { fg: knobIconColor, bg: knobIdleColor } = toneColors(colors, tone);
  const trackShadow = elevation(colors, isDark, 1);
  const knobShadow = isDark
    ? {}
    : Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        default: { elevation: 5 },
      }) ?? {};
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!completed && !processing) {
      translateX.value = withSpring(0);
    }
  }, [completed, processing, translateX]);

  const BUTTON_HEIGHT = Touch.button;
  const KNOB_SIZE = Touch.min;
  const PADDING = 4;
  const LABEL_SIDE_INSET = KNOB_SIZE + PADDING + 6;
  const maxTranslate = SCREEN_WIDTH * 0.7 - KNOB_SIZE - PADDING * 2;

  // .onEnd in RNGH v2+ runs on the JS thread by default, so state
  // updates and callbacks can be called directly — no runOnJS needed.
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      if (disabled || completed) return;
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onUpdate((e) => {
      if (disabled || completed) return;
      translateX.value = Math.max(0, Math.min(e.translationX, maxTranslate));
    })
    .onEnd(() => {
      if (disabled || completed) return;
      if (translateX.value >= maxTranslate * 0.9) {
        translateX.value = withSpring(maxTranslate);
        if (Platform.OS === "ios") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onSwipeComplete();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: interpolate(
      translateX.value,
      [0, maxTranslate],
      [KNOB_SIZE + PADDING * 2, SCREEN_WIDTH * 0.7],
    ),
    opacity: 1,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, maxTranslate], [1, 0.15]),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, maxTranslate * 0.5], [1, 0]),
  }));

  return (
    <View
      style={[
        styles.shadowWrapper,
        { width: SCREEN_WIDTH * 0.7, opacity: disabled ? 0.5 : 1 },
        trackShadow,
      ]}
    >
      <View style={[styles.outerWrapper, { height: BUTTON_HEIGHT }]}>
        <Animated.View
          style={[
            styles.backgroundLayer,
            animatedContainerStyle,
            !isPrimary && { backgroundColor: fillColor },
          ]}
        >
          {isPrimary && <GradientFill colors={colors.gradient} />}
        </Animated.View>

        <Animated.View
          style={[
            styles.fillLayer,
            animatedFillStyle,
            { backgroundColor: fillColor },
          ]}
        />

        <Animated.Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={[
            styles.label,
            animatedTextStyle,
            {
              left: LABEL_SIDE_INSET,
              right: LABEL_SIDE_INSET,
              color: colors.textOnPrimary,
            },
          ]}
        >
          {completed ? "" : text}
        </Animated.Text>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.knob,
              animatedKnobStyle,
              {
                width: KNOB_SIZE,
                height: KNOB_SIZE,
                top: (BUTTON_HEIGHT - KNOB_SIZE) / 2,
                left: PADDING,
                backgroundColor: completed ? fillColor : knobIdleColor,
                ...knobShadow,
              },
            ]}
          >
            {completed ? (
              <Ionicons
                name="checkmark"
                size={22}
                color={colors.textOnPrimary}
              />
            ) : (
              <Ionicons name={icon as any} size={22} color={knobIconColor} />
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: Radius.full,
    alignSelf: "center",
  },
  outerWrapper: {
    borderRadius: Radius.full,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  backgroundLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.full,
  },
  fillLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: Radius.full,
  },
  knob: {
    borderRadius: Radius.full,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    position: "absolute",
    alignSelf: "center",
    ...Type.button,
    textAlign: "center",
  },
});
