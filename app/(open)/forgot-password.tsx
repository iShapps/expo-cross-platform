import {
  AppButton,
  AppText,
  AuthLayout,
  IconBadge,
  IconButton,
  TextField,
} from "@/components/design";
import OTPInput, { useOTPInput } from "@/components/shared/otp-input";
import { Radius, Space, Touch } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  AuthenticationError,
  NetworkError,
  resetPassword,
  sendResetCode,
  verifyResetCode,
} from "@/utils/auth-api";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showInputs, setShowInputs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { otp, handleChange, handleComplete } = useOTPInput(6);

  // Send reset code to email
  const handleSendResetCode = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await sendResetCode({ email });

      Alert.alert(
        "Success",
        result.message || "Reset code sent to your email",
        [
          {
            text: "OK",
            // onPress: () => setShowModal(true),
            onPress: () => router.replace("/(open)/login"),
          },
        ],
      );
    } catch (error) {
      if (error instanceof AuthenticationError) {
        let errorMessage = error.message;

        if (error.errors) {
          const errorMessages = Object.values(error.errors).flat().join("\n");
          errorMessage = errorMessages || error.message;
        }

        Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      } else if (error instanceof NetworkError) {
        Alert.alert("Connection Error", error.message, [
          { text: "OK" },
          {
            text: "Retry",
            onPress: handleSendResetCode,
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again.",
          [{ text: "OK" }],
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (isVerifying) return;

    setIsVerifying(true);
    try {
      const result = await verifyResetCode({ email, otp });

      Alert.alert("Success", result.message || "Code verified successfully", [
        {
          text: "OK",
          onPress: () => {
            setShowInputs(true);
            setShowModal(false);
          },
        },
      ]);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        let errorMessage = error.message;

        if (error.errors) {
          const errorMessages = Object.values(error.errors).flat().join("\n");
          errorMessage = errorMessages || error.message;
        }

        Alert.alert("Verification Failed", errorMessage, [{ text: "OK" }]);
      } else if (error instanceof NetworkError) {
        Alert.alert("Connection Error", error.message, [
          { text: "OK" },
          {
            text: "Retry",
            onPress: handleVerifyOTP,
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again.",
          [{ text: "OK" }],
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (isResetting) return;

    setIsResetting(true);
    try {
      const result = await resetPassword({
        email,
        otp,
        password,
        password_confirmation: confirmPassword,
      });

      Alert.alert("Success", result.message || "Password reset successfully", [
        {
          text: "Login",
          onPress: () => router.replace("/(open)/login"),
        },
      ]);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        let errorMessage = error.message;

        if (error.errors) {
          const errorMessages = Object.values(error.errors).flat().join("\n");
          errorMessage = errorMessages || error.message;
        }

        Alert.alert("Reset Failed", errorMessage, [{ text: "OK" }]);
      } else if (error instanceof NetworkError) {
        Alert.alert("Connection Error", error.message, [
          { text: "OK" },
          {
            text: "Retry",
            onPress: handleResetPassword,
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again.",
          [{ text: "OK" }],
        );
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await sendResetCode({ email });
      Alert.alert("Success", "New code sent to your email", [{ text: "OK" }]);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        Alert.alert("Error", error.message, [{ text: "OK" }]);
      } else if (error instanceof NetworkError) {
        Alert.alert("Connection Error", error.message, [{ text: "OK" }]);
      }
    }
  };

  return (
    <AuthLayout
      identity={<IconBadge icon="key-outline" tone="primary" size={64} />}
      title="Reset password"
      subtitle={
        showInputs
          ? "Enter your new password below."
          : "Enter your email address below so you can receive a reset code."
      }
    >
      <View style={styles.form}>
        <TextField
          label="Email address"
          icon="mail-outline"
          value={email}
          inputMode="email"
          autoComplete="email"
          clearButtonMode="while-editing"
          autoFocus={!showInputs}
          enterKeyHint="next"
          placeholder="johnwilliams@gmail.com"
          onChangeText={setEmail}
          editable={!showInputs && !isLoading}
        />

        {showInputs && (
          <TextField
            label="New password"
            icon="lock-closed-outline"
            secure
            value={password}
            autoFocus={showInputs}
            enterKeyHint="next"
            clearButtonMode="while-editing"
            autoComplete="new-password"
            onChangeText={setPassword}
            placeholder="••••••••"
            editable={!isResetting}
          />
        )}

        {showInputs && (
          <TextField
            label="Confirm password"
            icon="lock-closed-outline"
            secure
            value={confirmPassword}
            enterKeyHint="done"
            clearButtonMode="while-editing"
            autoComplete="new-password"
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            editable={!isResetting}
          />
        )}

        {showInputs ? (
          <AppButton
            title="Reset password"
            onPress={handleResetPassword}
            loading={isResetting}
            disabled={isResetting}
            fullWidth
          />
        ) : (
          <AppButton
            title="Send reset code"
            icon="paper-plane-outline"
            iconPosition="right"
            onPress={handleSendResetCode}
            loading={isLoading}
            loadingTitle="Sending reset code…"
            disabled={isLoading}
            fullWidth
          />
        )}

        <View style={styles.footer}>
          <AppText variant="subhead" color="textSecondary">
            Remembered your password?
          </AppText>
          <Link href="/(open)/login" asChild>
            <Pressable accessibilityRole="link" hitSlop={8} style={styles.footerLink}>
              <AppText variant="subhead" color="primaryStrong">
                Back to sign in
              </AppText>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* OTP Verification Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowModal(false);
        }}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <IconButton
              icon="close"
              accessibilityLabel="Close"
              variant="plain"
              style={styles.modalClose}
              onPress={() => setShowModal(false)}
            />
            <IconBadge icon="shield-checkmark-outline" tone="primary" size={72} />
            <AppText variant="title3" align="center">
              Enter verification code
            </AppText>
            <AppText variant="callout" color="textSecondary" align="center">
              Enter the 6-digit verification code sent to {email}.
            </AppText>

            <OTPInput
              onChange={handleChange}
              onComplete={handleComplete}
              length={6}
              containerStyle={styles.otp}
            />

            <Pressable
              accessibilityRole="button"
              style={styles.resend}
              onPress={handleResendCode}
            >
              <AppText variant="subhead" color="textSecondary">
                Didn&apos;t get the code?
              </AppText>
              <AppText variant="subhead" color="primaryStrong">
                Resend
              </AppText>
            </Pressable>

            <AppButton
              title="Verify"
              onPress={handleVerifyOTP}
              loading={isVerifying}
              disabled={isVerifying}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Space.md,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: Space.xxs,
  },
  footerLink: {
    minHeight: Touch.min,
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Space.gutter,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.xxl,
    padding: Space.xl,
    paddingTop: Space.xxl,
    alignItems: "center",
    gap: Space.sm,
  },
  modalClose: {
    position: "absolute",
    top: Space.xs,
    right: Space.xs,
  },
  otp: {
    marginVertical: Space.sm,
  },
  resend: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xxs,
    minHeight: Touch.min,
  },
});
