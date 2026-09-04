import { isAuthError } from "@/api-actions/error-utils";
import { ApiMutationError } from "@/api-actions/mutations";
import { changePassword } from "@/api-queries/profile";
import { Colors, Radii } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AntDesign } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMutation } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "./ctx";

export default function ForcePasswordResetScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const { signOut } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,

    onSuccess: (response) => {
      if (response.status) {
        Alert.alert(
          "Password updated",
          "Your password has been changed. Please sign in again with your new password.",
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // force-password-reset is an unguarded top-level screen so redirect explicitly.
        void signOut().then(() => {
          router.replace("/(open)/login");
        });
      } else {
        Alert.alert("Error", response.message);
      }
    },

    onError: (error: ApiMutationError) => {
      if (isAuthError(error)) return;
      const message =
        error?.message || "Password change failed. Please try again.";

      Alert.alert("Error", message);
    },
  });

  const handleSubmit = () => {
    setFormError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setFormError("New password cannot be the same as current password.");
      return;
    }

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const isInvalid =
    !currentPassword ||
    !newPassword ||
    !confirmPassword ||
    newPassword !== confirmPassword ||
    newPassword === currentPassword;

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (changePasswordMutation.isPending) {
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
  }, [changePasswordMutation.isPending, spinAnim]);

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    visible: boolean,
    onToggleVisible: () => void,
  ) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <MaterialCommunityIcons
          name="lock-outline"
          size={18}
          color={theme.secondaryText}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder="••••••••"
          placeholderTextColor={theme.secondaryText}
          cursorColor={theme.primary}
          style={styles.input}
        />
        <Pressable onPress={onToggleVisible} hitSlop={8}>
          <Entypo
            name="eye"
            size={20}
            color={visible ? theme.primary : theme.secondaryText}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Security</Text>
        <Text style={styles.title}>Change your password</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroPanel}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="shield-key-outline"
                size={22}
                color={theme.white}
              />
            </View>
            <Text style={styles.heroText}>
              For your security, you need to change your password before you can
              continue.
            </Text>
          </View>

          <View style={styles.formSection}>
            {renderPasswordField(
              "Current Password",
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              () => setShowCurrentPassword(!showCurrentPassword),
            )}
            {renderPasswordField(
              "New Password",
              newPassword,
              setNewPassword,
              showNewPassword,
              () => setShowNewPassword(!showNewPassword),
            )}
            {renderPasswordField(
              "Confirm New Password",
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword),
            )}

            {formError && <Text style={styles.errorText}>{formError}</Text>}

            <Pressable
              onPress={handleSubmit}
              disabled={isInvalid || changePasswordMutation.isPending}
              style={[styles.primaryButton, isInvalid && { opacity: 0.5 }]}
            >
              {changePasswordMutation.isPending && (
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
                    size={18}
                    color={theme.white}
                  />
                </Animated.View>
              )}
              <Text style={styles.primaryButtonText}>
                {changePasswordMutation.isPending
                  ? "Changing password..."
                  : "Update Password"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {changePasswordMutation.isPending && (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <BlurView
            intensity={45}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.busyCard}>
            <ActivityIndicator size="large" color={theme.white} />
            <Text style={styles.busyText}>Changing password...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const SURFACE_TINT = "#F2F9E9";
const ACCENT_BORDER = "#CFE8A8";
const TEXT_SAFE_PRIMARY = "#3D7A00";

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 14,
      backgroundColor: theme.whiteBackground,
      borderBottomWidth: 2,
      borderBottomColor: ACCENT_BORDER,
    },
    kicker: {
      color: TEXT_SAFE_PRIMARY,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    title: {
      color: theme.primaryText,
      fontSize: 20,
      fontWeight: "700",
      marginTop: 4,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 16,
      gap: 14,
      backgroundColor: SURFACE_TINT,
    },
    heroPanel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: Radii.md,
      backgroundColor: theme.heroBg,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    heroIcon: {
      width: 44,
      height: 44,
      borderRadius: Radii.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
    },
    heroText: {
      flex: 1,
      color: theme.primaryText,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    formSection: {
      gap: 14,
    },
    field: {
      gap: 7,
    },
    fieldLabel: {
      color: theme.primaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    inputShell: {
      minHeight: 42,
      borderWidth: 1,
      borderColor: ACCENT_BORDER,
      borderRadius: Radii.sm,
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    input: {
      flex: 1,
      color: theme.primaryText,
      fontSize: 15,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
    },
    primaryButton: {
      marginTop: 4,
      backgroundColor: theme.primary,
      borderRadius: Radii.sm,
      paddingVertical: 13,
      alignItems: "center",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: theme.white,
      fontSize: 15,
      fontWeight: "600",
    },
    busyOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
      elevation: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(10, 16, 26, 0.18)",
    },
    busyCard: {
      minWidth: 220,
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderRadius: Radii.md,
      alignItems: "center",
      gap: 12,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
    },
    busyText: {
      color: theme.white,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
  });
