import OTPInput, { useOTPInput } from "@/components/shared/otp-input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  AuthenticationError,
  NetworkError,
  resetPassword,
  sendResetCode,
  verifyResetCode,
} from "@/utils/auth-api";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showInputs, setShowInputs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { otp, handleChange, handleComplete } = useOTPInput(6);

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
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
  }, [isLoading, spinAnim]);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View
        style={{
          backgroundColor: theme.background,
          flex: 1,
        }}
      >
        <View style={styles.topContainer}></View>
        <View style={styles.topAbsContainer}>
          <View
            style={[
              styles.topAbsContainerLeft,
              {
                backgroundColor: theme.background,
              },
            ]}
          ></View>
          <View
            style={[
              styles.topAbsContainerRight,
              { backgroundColor: theme.lightBorder },
            ]}
          >
            <View
              style={[
                styles.innerContainer,
                {
                  backgroundColor: theme.background,
                },
              ]}
            ></View>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <View style={{ marginBottom: 20, marginTop: 10 }}>
            <Text
              style={{
                fontSize: 28,
                color: theme.primaryText,
                fontWeight: "700",
                marginBottom: 10,
              }}
            >
              Reset Password
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.secondaryText,
              }}
            >
              {showInputs
                ? "Enter your new password below."
                : "Enter your email address below so you can receive a reset code."}
            </Text>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={email ? styles.labelFilled : styles.label}>
              Email Address
            </Text>
            <TextInput
              value={email}
              inputMode="email"
              autoComplete="email"
              clearButtonMode="while-editing"
              autoFocus={!showInputs}
              cursorColor={theme.primary}
              enterKeyHint="next"
              placeholder="johnwilliams@gmail.com"
              onChangeText={setEmail}
              placeholderTextColor={theme.secondaryText}
              editable={!showInputs && !isLoading}
              style={email ? styles.inputFilled : styles.input}
            />
          </View>

          {/* Password */}
          {showInputs && (
            <View style={styles.inputGroup}>
              <Text style={password ? styles.labelFilled : styles.label}>
                Password
              </Text>
              <View
                style={
                  password
                    ? styles.passwordInputGroupFilled
                    : styles.passwordInputGroup
                }
              >
                <TextInput
                  value={password}
                  autoFocus={showInputs}
                  cursorColor={theme.primary}
                  enterKeyHint="next"
                  clearButtonMode="while-editing"
                  autoComplete="new-password"
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.tertiaryText}
                  secureTextEntry={!showPassword}
                  editable={!isResetting}
                  style={{
                    flex: 1,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Entypo name="eye" size={20} color={theme.primaryText} />
                  ) : (
                    <Entypo
                      name="eye-with-line"
                      size={20}
                      color={theme.primaryText}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showInputs && (
            <View style={styles.inputGroup}>
              <Text style={confirmPassword ? styles.labelFilled : styles.label}>
                Confirm password
              </Text>
              <View
                style={
                  confirmPassword
                    ? styles.passwordInputGroupFilled
                    : styles.passwordInputGroup
                }
              >
                <TextInput
                  value={confirmPassword}
                  cursorColor={theme.primary}
                  enterKeyHint="done"
                  clearButtonMode="while-editing"
                  autoComplete="new-password"
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.tertiaryText}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isResetting}
                  style={{
                    flex: 1,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <Entypo name="eye" size={20} color={theme.primaryText} />
                  ) : (
                    <Entypo
                      name="eye-with-line"
                      size={20}
                      color={theme.primaryText}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Button */}
          {showInputs ? (
            <TouchableOpacity
              style={[styles.button, isResetting && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isResetting}
            >
              {isResetting ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <Text style={styles.buttonText}>Reset password</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSendResetCode}
              style={[styles.button, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              {isLoading && (
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
                {isLoading ? "sending reset code...." : "Reset password"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Footer */}
          <Text style={[styles.footer, { color: theme.secondaryText }]}>
            Remembered password?{" "}
            <Link href="/(open)/login">
              <Text
                style={{
                  color: theme.activeText,
                  textDecorationLine: "underline",
                }}
              >
                {" "}
                Login to your account
              </Text>
            </Link>
          </Text>
        </View>

        {/* OTP Verification Modal */}
        <Modal
          visible={showModal}
          transparent={true}
          onRequestClose={() => {
            setShowModal(false);
          }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalBody}>
              <View style={styles.modelContentBody}>
                <TouchableOpacity
                  style={{ alignSelf: "flex-end" }}
                  onPress={() => setShowModal(false)}
                >
                  <AntDesign name="close" size={20} color={theme.primary} />
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      borderRadius: 50,
                      backgroundColor: "rgba(112, 198, 1, 0.15)",
                      width: 100,
                      height: 100,
                      padding: 5,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MaterialIcons
                      name="verified"
                      size={60}
                      color={theme.primary}
                    />
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    color: "#000000",
                    fontWeight: "700",
                    textAlign: "center",
                    marginVertical: 5,
                  }}
                >
                  Enter Verification Code!
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#999",
                    textAlign: "center",
                    marginTop: 5,
                    marginBottom: 10,
                  }}
                >
                  Enter the 6-digit verification code sent to {email}.
                </Text>

                <OTPInput
                  onChange={handleChange}
                  onComplete={handleComplete}
                  length={6}
                />

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4,
                    marginVertical: 10,
                  }}
                  onPress={handleResendCode}
                >
                  <Text>Didn&apos;t get the code?</Text>
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 14,
                      fontWeight: "600",
                      textDecorationLine: "underline",
                    }}
                  >
                    Resend
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleVerifyOTP}
                  style={[
                    styles.modalButton,
                    isVerifying && styles.buttonDisabled,
                  ]}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <View
        style={{
          backgroundColor: theme.whiteBackground,
          height: "auto",
        }}
      ></View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
    },
    modalContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modelContentBody: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
    },
    modalBody: {
      backgroundColor: theme.background,
      padding: 10,
      borderRadius: 8,
      width: "92%",
    },
    topContainer: {
      height: "20%",
      justifyContent: "center",
      alignItems: "center",
    },
    bottomContainer: {
      flex: 1,
      height: "auto",
      width: "100%",
      backgroundColor: theme.lightBorder,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderTopLeftRadius: 55,
    },
    image: {
      width: 120,
      height: 120,
      alignSelf: "center",
      marginBottom: 16,
    },
    topAbsContainer: {
      height: "15%",
      width: "100%",
      display: "flex",
      flexDirection: "row",
    },
    topAbsContainerLeft: {
      backgroundColor: theme.background,
      height: "100%",
      width: "50%",
      marginTop: -50,
      borderTopLeftRadius: 55,
    },
    topAbsContainerRight: {
      backgroundColor: theme.heroBorder,
      height: "100%",
      width: "50%",
      marginTop: 10,
    },
    innerContainer: {
      height: "100%",
      width: "100%",
      backgroundColor: theme.background,
      borderBottomRightRadius: 55,
      marginTop: -10,
    },
    inputGroup: {
      marginBottom: 16,
    },
    passwordInputGroup: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.activeText,
      paddingVertical: 8,
      fontSize: 16,
      gap: 8,
    },
    passwordInputGroupFilled: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.primary,
      paddingVertical: 8,
      fontSize: 16,
      gap: 8,
    },
    label: {
      fontSize: 14,
      color: theme.tertiaryText,
      fontWeight: "700",
      marginBottom: 6,
    },
    labelFilled: {
      fontSize: 14,
      color: theme.activeText,
      fontWeight: "700",
      marginBottom: 6,
    },
    input: {
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryText,
      paddingVertical: 8,
      fontSize: 16,
      color: theme.activeText,
    },
    inputFilled: {
      borderBottomWidth: 1,
      borderBottomColor: theme.primary,
      paddingVertical: 8,
      fontSize: 16,
      color: theme.activeText,
    },
    optionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 16,
    },
    remember: {
      color: theme.tertiaryText,
      fontSize: 14,
    },
    forgot: {
      color: theme.activeText,
      fontSize: 14,
      fontWeight: "600",
    },
    button: {
      backgroundColor: theme.activeText,
      paddingVertical: 10,
      borderRadius: 4,
      alignItems: "center",
      marginTop: 6,
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    modalButton: {
      backgroundColor: theme.activeText,
      paddingVertical: 10,
      borderRadius: 5,
      alignItems: "center",
      marginTop: 6,
    },
    buttonText: {
      color: theme.white,
      fontSize: 16,
      fontWeight: "400",
    },
    footer: {
      marginTop: 20,
      color: theme.tertiaryText,
    },
    signup: {
      color: theme.activeText,
      fontWeight: "700",
    },
    checkbox: {
      margin: 4,
    },
  });
