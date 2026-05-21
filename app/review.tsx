import { isAuthError } from "@/api-actions/error-utils";
import { rateShift } from "@/api-queries/profile";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AntDesign } from "@expo/vector-icons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const STAR_COUNT = 5;

export default function ReviewScreen() {
  const params = useLocalSearchParams();
  const shift_id = Number(params.shift_id);
  const facility_id = Number(params.facility_id);
  const category_id = Number(params.category_id);
  const profession_id = Number(params.profession_id);

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const handleStarPress = (index: number) => {
    setRating(index + 1);
  };

  const shiftRatingMutation = useMutation({
    mutationFn: () =>
      rateShift({
        shift_id,
        facility_id,
        category_id,
        profession_id,
        rating,
        comment: review.trim() ? review.trim() : "",
      }),
  });

  const submitReview = () => {
    shiftRatingMutation.mutate(undefined, {
      onSuccess: (response) => {
        if (response.status) {
          Alert.alert("Success", response.message);
          router.back();
        } else {
          Alert.alert("Error", response.message);
        }
      },
      onError: (error) => {
        if (isAuthError(error)) return;
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "An error occurred while submitting your review.",
        );
      },
    });
  };

  // Pull-down-to-close logic
  const sheetY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          router.back();
        } else {
          Animated.spring(sheetY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shiftRatingMutation.isPending) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [shiftRatingMutation.isPending, spinAnim]);
  const hasRequiredParams =
    shift_id && facility_id && category_id && profession_id;
  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => router.back()}
        />

        {/* Sheet */}
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.title}>How was your shift?</Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[...Array(STAR_COUNT)].map((_, i) => {
              const selected = i < rating;
              return (
                <Pressable
                  key={i}
                  onPress={() => handleStarPress(i)}
                  hitSlop={10}
                >
                  <SimpleLineIcons
                    name="star"
                    size={42}
                    color={selected ? theme.primary : theme.greyBorder}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Optional hint like Bolt */}
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating <= 2
                ? "Not great"
                : rating === 3
                  ? "Okay"
                  : rating === 4
                    ? "Good"
                    : "Excellent"}
            </Text>
          )}

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="Write a review (optional)..."
            placeholderTextColor={theme.secondaryText}
            value={review}
            onChangeText={setReview}
            multiline
            maxLength={300}
          />

          <Pressable
            onPress={submitReview}
            disabled={
              shiftRatingMutation.isPending ||
              !hasRequiredParams ||
              rating === 0
            }
            style={[
              styles.button,
              shiftRatingMutation.isPending && { opacity: 0.5 },
            ]}
          >
            {shiftRatingMutation.isPending && (
              <Animated.View
                style={{
                  marginRight: 10,
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <AntDesign
                  name="loading-3-quarters"
                  size={20}
                  color={theme.white}
                />
              </Animated.View>
            )}
            <Text style={styles.buttonText}>
              {shiftRatingMutation.isPending
                ? "Submitting review..."
                : "Submit review"}
            </Text>
          </Pressable>

          {/* Skip */}
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },

    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },

    sheet: {
      backgroundColor: theme.whiteBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 30,
    },

    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.primaryText,
      textAlign: "center",
      marginBottom: 20,
    },

    starsRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 12,
      gap: 12,
    },

    ratingText: {
      textAlign: "center",
      fontSize: 14,
      color: theme.secondaryText,
      marginBottom: 12,
    },

    input: {
      width: "100%",
      minHeight: 80,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      backgroundColor: theme.whiteBackground,
      color: theme.primaryText,
      fontSize: 14,
      padding: 12,
      marginBottom: 16,
      textAlignVertical: "top",
    },

    button: {
      width: "100%",
      backgroundColor: theme.primary,
      borderRadius: 30,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      display: "flex",
      flexDirection: "row",
    },

    buttonDisabled: {
      opacity: 0.5,
    },

    buttonText: {
      color: theme.white,
      fontSize: 16,
    },

    skip: {
      textAlign: "center",
      color: theme.secondaryText,
      fontSize: 14,
    },
  });
