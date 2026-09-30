import { isAuthError } from "@/api-actions/error-utils";
import { ApiMutationError } from "@/api-actions/mutations";
import { changePassword } from "@/api-queries/profile";
import {
  AppButton,
  AppText,
  Card,
  Icon,
  IconBadge,
  TextField,
} from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMutation } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "./ctx";

export default function ForcePasswordResetScreen() {
  const { colors, isDark } = useAppTheme();

  const { signOut } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
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
          <View style={styles.header}>
            <IconBadge icon="shield-checkmark-outline" tone="primary" size={64} />
            <AppText variant="overline" color="primaryStrong">
              Security
            </AppText>
            <AppText variant="title1">Change your password</AppText>
            <AppText variant="callout" color="textSecondary">
              For your security, you need to change your password before you can
              continue.
            </AppText>
          </View>

          <Card padding={Space.lg} style={styles.form}>
            <TextField
              label="Current password"
              icon="lock-closed-outline"
              secure
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
            />
            <TextField
              label="New password"
              icon="key-outline"
              secure
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
            />
            <TextField
              label="Confirm new password"
              icon="key-outline"
              secure
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
            />

            {formError && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
                <Icon name="alert-circle-outline" size={18} color={colors.danger} />
                <AppText variant="footnote" color="danger" style={styles.errorText}>
                  {formError}
                </AppText>
              </View>
            )}

            <AppButton
              title="Update password"
              onPress={handleSubmit}
              disabled={isInvalid || changePasswordMutation.isPending}
              loading={changePasswordMutation.isPending}
              loadingTitle="Changing password…"
              fullWidth
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {changePasswordMutation.isPending && (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <BlurView
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.busyCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="headline" align="center">
              Changing password…
            </AppText>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Space.gutter,
    paddingTop: Space.xl,
    gap: Space.xl,
  },
  header: {
    gap: Space.xs,
    alignItems: "flex-start",
  },
  form: {
    gap: Space.md,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    padding: Space.sm,
    borderRadius: Radius.sm,
  },
  errorText: {
    flex: 1,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  busyCard: {
    minWidth: 220,
    paddingHorizontal: Space.xl,
    paddingVertical: Space.lg,
    borderRadius: Radius.xl,
    alignItems: "center",
    gap: Space.sm,
  },
});
