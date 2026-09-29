import { isAuthError } from "@/api-actions/error-utils";
import { rateShift } from "@/api-queries/profile";
import { AppButton, AppText, Icon } from "@/components/design";
import { FontFamily, Radius, Space, Touch, type AppColors } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STAR_COUNT = 5;

export default function ReviewScreen() {
  const params = useLocalSearchParams();
  const shift_id = Number(params.shift_id);
  const facility_id = Number(params.facility_id);
  const category_id = Number(params.category_id);
  const profession_id = Number(params.profession_id);

  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

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
          accessibilityLabel="Close"
        />

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Space.lg, transform: [{ translateY: sheetY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          <AppText variant="title2" align="center">
            How was your shift?
          </AppText>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[...Array(STAR_COUNT)].map((_, i) => {
              const selected = i < rating;
              return (
                <Pressable
                  key={i}
                  onPress={() => handleStarPress(i)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1} star${i ? "s" : ""}`}
                  style={styles.star}
                >
                  <Icon
                    name={selected ? "star" : "star-outline"}
                    size={38}
                    color={selected ? colors.amber : colors.borderStrong}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Optional hint like Bolt */}
          {rating > 0 && (
            <AppText variant="subhead" color="textSecondary" align="center">
              {rating <= 2
                ? "Not great"
                : rating === 3
                  ? "Okay"
                  : rating === 4
                    ? "Good"
                    : "Excellent"}
            </AppText>
          )}

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="Write a review (optional)..."
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.primary}
            value={review}
            onChangeText={setReview}
            multiline
            maxLength={300}
          />

          <AppButton
            title="Submit review"
            onPress={submitReview}
            loading={shiftRatingMutation.isPending}
            loadingTitle="Submitting review..."
            disabled={
              shiftRatingMutation.isPending ||
              !hasRequiredParams ||
              rating === 0
            }
            fullWidth
          />

          {/* Skip */}
          <AppButton title="Skip" variant="ghost" onPress={() => router.back()} fullWidth />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "transparent",
    },
    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      paddingHorizontal: Space.gutter,
      paddingTop: Space.sm,
      gap: Space.sm,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 5,
      borderRadius: Radius.full,
      backgroundColor: colors.borderStrong,
      marginBottom: Space.sm,
    },
    starsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Space.xxs,
      marginVertical: Space.xs,
    },
    star: {
      width: Touch.min + 4,
      height: Touch.min + 4,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      width: "100%",
      minHeight: 96,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.surfaceMuted,
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
      fontFamily: FontFamily.regular,
      fontSize: 16,
      padding: Space.md,
      marginVertical: Space.xs,
      textAlignVertical: "top",
    },
  });
