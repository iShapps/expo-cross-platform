import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface SwipeButtonProps {
  text: string;
  onSwipeComplete: () => void;
  disabled?: boolean;
  bgColor?: string;
  icon?: string;
  completed?: boolean;
  processing?: boolean;
}

export const SwipeButton = ({
  text,
  onSwipeComplete,
  disabled,
  bgColor = "#70C601",
  icon = "chevron-forward",
  completed = false,
  processing = false,
}: SwipeButtonProps) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!completed && !processing) {
      translateX.value = withSpring(0);
    }
  }, [completed, processing, translateX]);

  const BUTTON_HEIGHT = 60;
  const KNOB_SIZE = 52;
  const PADDING = 4;
  const LABEL_SIDE_INSET = KNOB_SIZE + PADDING + 6;
  const maxTranslate = SCREEN_WIDTH * 0.7 - KNOB_SIZE - PADDING * 2;

  const progress = useDerivedValue(() =>
    interpolate(translateX.value, [0, maxTranslate], [0, 1]),
  );

  // .onEnd in RNGH v2+ runs on the JS thread by default, so state
  // updates and callbacks can be called directly — no runOnJS needed.
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      if (disabled || completed) return;
      translateX.value = Math.max(0, Math.min(e.translationX, maxTranslate));
    })
    .onEnd(() => {
      if (disabled || completed) return;
      if (translateX.value >= maxTranslate * 0.9) {
        translateX.value = withSpring(maxTranslate);
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

  const animatedIconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [1, 0], ["#ffffff", bgColor]),
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, maxTranslate * 0.5], [1, 0]),
  }));

  return (
    <View
      style={[
        styles.outerWrapper,
        {
          width: SCREEN_WIDTH * 0.7,
          borderColor: `${bgColor}60`,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.backgroundLayer,
          animatedContainerStyle,
          { backgroundColor: bgColor },
        ]}
      />

      <Animated.View
        style={[
          styles.fillLayer,
          animatedFillStyle,
          { backgroundColor: bgColor },
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
              backgroundColor: completed ? bgColor : "#ffffff",
            },
          ]}
        >
          {completed ? (
            <Ionicons name="checkmark" size={26} color="#ffffff" />
          ) : (
            <Animated.Text style={animatedIconStyle}>
              <Ionicons name={icon as any} size={24} />
            </Animated.Text>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    alignSelf: "center",
  },
  backgroundLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  fillLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 50,
  },
  knob: {
    borderRadius: 30,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  label: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
