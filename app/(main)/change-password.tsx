import { isAuthError } from "@/api-actions/error-utils";
import { ApiMutationError } from "@/api-actions/mutations";
import { changePassword } from "@/api-queries/profile";
import {
  AppButton,
  AppText,
  BusyOverlay,
  Card,
  Icon,
  ScreenHeader,
  TextField,
} from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../ctx";

export default function ChangePasswordScreen() {
  const { colors } = useAppTheme();

  const { signOut } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,

    onSuccess: (response) => {
      if (response.status) {
        Alert.alert("Success", response.message);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        signOut();
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScreenHeader title="Change password" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="callout" color="textSecondary">
          Choose a new password. You&apos;ll be signed out and asked to sign in
          again with it.
        </AppText>

        <Card radius={Radius.xl} padding={Space.lg} style={styles.form}>
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
              <AppText variant="footnote" color="danger" style={styles.flex}>
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

      {changePasswordMutation.isPending && (
        <BusyOverlay message="Changing password..." />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: Space.xxl,
    gap: Space.md,
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
});
