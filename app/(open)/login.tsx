import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/data-store/use-settings-store";
import LoginCredentials from "@/data-types/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ensureOneSignalSubscriptionId,
  useOneSignal,
} from "@/hooks/use-one-signal";
import {
  authenticateWithBiometrics,
  isBiometricAllowed,
  isBiometricAvailable,
} from "@/utils/biometrics";
import {
  getLoginCredentials,
  saveLoginCredentials,
} from "@/utils/secure-login-credentials";
import { AntDesign, Entypo, FontAwesome6, Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { Checkbox } from "expo-checkbox";
import * as Device from "expo-device";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../ctx";

export default function Login() {
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  useOneSignal();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isTermsChecked, setIsTermsChecked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading } = useSession();
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const isLoginBusy = isLoading || isSubmittingLogin;

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricAllowed, setBiometricAllowed] = useState(false);

  const biometricsEnabled = useSettingsStore(
    (state) => state.biometricsEnabled,
  );

  const spinAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);
  const loginInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isLoginBusy) {
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
  }, [isLoginBusy, spinAnim]);

  // Check for biometric support on mount
  useEffect(() => {
    (async () => {
      setBiometricSupported(await isBiometricAvailable());
    })();
  }, []);

  // Check if biometrics are allowed
  useEffect(() => {
    (async () => {
      setBiometricAllowed(await isBiometricAllowed());
    })();
  }, []);

  const handleLogin = async () => {
    if (isLoginBusy || loginInFlightRef.current) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "info",
        message: "loginSubmitIgnored",
        data: {
          reason: "already_submitting",
        },
      });
      return;
    }

    // check if terms are accepted
    if (!isTermsChecked) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "warning",
        message: "loginValidationFailed",
        data: {
          reason: "terms_not_accepted",
          hasEmail: email.trim().length > 0,
          hasPassword: password.trim().length > 0,
        },
      });
      Alert.alert(
        "Terms Required",
        "You must agree to the terms and privacy policy.",
        [{ text: "OK" }],
      );
      return;
    }

    if (!email.trim()) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "warning",
        message: "loginValidationFailed",
        data: {
          reason: "missing_email",
          hasEmail: false,
          hasPassword: password.trim().length > 0,
        },
      });
      Alert.alert("Login Failed", "Email is required", [{ text: "OK" }]);
      return;
    }

    if (!password.trim()) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "warning",
        message: "loginValidationFailed",
        data: {
          reason: "missing_password",
          hasEmail: true,
          hasPassword: false,
        },
      });
      Alert.alert("Login Failed", "Password is required", [{ text: "OK" }]);
      return;
    }

    loginInFlightRef.current = true;
    setIsSubmittingLogin(true);

    try {
      const subscriptionId = await ensureOneSignalSubscriptionId();

      const loginPayload: LoginCredentials = {
        email,
        password,
        // optionals : get device info
        // Device.modelName; // Android: "Pixel 2"; iOS: "iPhone XS Max"; web: "iPhone", null
        // Device.osBuildId; // Android: "PSR1.180720.075"; iOS: "16F203"; web: null
        // Device.osInternalBuildId; // Android: "MMB29K"; iOS: "16F203"; web: null,
        // Device.osName; // Android: "Android"; iOS: "iOS" or "iPadOS"; web: "iOS", "Android", "Windows"
        // Device.osVersion; // Android: "4.0.3"; iOS: "12.3.1"; web: "11.0", "8.1.0"
        // Device.manufacturer; // Android: "Google", "xiaomi"; iOS: "Apple"; web: "Google", null
        // Device.deviceType; // UNKNOWN, PHONE, TABLET, TV, DESKTOP
        // Device.deviceName; // "Vivian's iPhone XS"
        // Device.designName; // Android: "kminilte"; iOS: null; web: null
        // Device.brand; // Android: "google", "xiaomi"; iOS: "Apple"; web: null
        device_name: Device.deviceName ?? Device.modelName ?? "Unknown Device",
        device_type: Device.deviceType?.toString() ?? "Unknown Device", //Device.osName ?? "Unknown Device",
        device_version: Device.osVersion ?? "Unknown Version",
        device_id: "",
      };

      if (subscriptionId) {
        loginPayload.device_id = subscriptionId;
      }

      await signIn(loginPayload);

      if (!isMountedRef.current) {
        return;
      }

      if (biometricSupported && biometricAllowed) {
        await saveLoginCredentials(email, password);
      }

      // Ask for biometric consent after successful login if supported but not yet allowed
      if (biometricSupported && !biometricAllowed) {
        Alert.alert(
          "Enable Biometric Login?",
          "Would you like to enable biometric login for future sign-ins? Your credentials will be securely stored.",
          [
            {
              text: "Yes",
              onPress: async () => {
                await saveLoginCredentials(email, password);
                Alert.alert(
                  "Biometric login enabled",
                  "You can now use biometrics to sign in.",
                );
              },
            },
            {
              text: "No",
              style: "cancel",
            },
          ],
        );
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      loginInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsSubmittingLogin(false);
      }
    }
  };

  // Biometric login handler
  const handleBiometricLogin = async () => {
    if (!biometricSupported) {
      Alert.alert(
        "Biometrics not available",
        "Your device does not support biometric authentication or it is not set up.",
      );
      return;
    }
    try {
      const authenticated = await authenticateWithBiometrics(
        "Sign in with biometrics",
      );
      if (!authenticated) {
        Alert.alert(
          "Authentication failed",
          "Biometric authentication was not successful.",
        );
        return;
      }
      // Retrieve stored credentials
      const creds = await getLoginCredentials();
      if (!creds.email || !creds.password) {
        Alert.alert(
          "No credentials",
          "No credentials found for biometric login. Please sign in manually first.",
        );
        return;
      }
      setEmail(creds.email);
      setPassword(creds.password);
      // await signIn({ email: creds.email, password: creds.password });
    } catch (error) {
      console.error("Biometric login error:", error);
      Alert.alert("Login failed", "Could not sign in with stored credentials.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View
          style={{
            backgroundColor: theme.background,
            height: 350,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Image
            source={require("@/assets/images/careworker2.jpg")}
            style={{ width: "100%", height: "100%", opacity: 0.5 }}
            contentFit="cover"
          />
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
              Login
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.secondaryText,
              }}
            >
              Login to securely access your account and manage your shifts
              anytime.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={email ? styles.labelFilled : styles.label}>
              Email Address
            </Text>
            <View
              style={
                password
                  ? styles.passwordInputGroupFilled
                  : styles.passwordInputGroup
              }
            >
              <TextInput
                value={email}
                inputMode="email"
                autoComplete="email"
                clearButtonMode="while-editing"
                autoFocus={true}
                clearTextOnFocus={false}
                cursorColor={theme.primaryText}
                enterKeyHint="next"
                placeholder="johnwilliams@gmail.com"
                onChangeText={setEmail}
                placeholderTextColor={theme.secondaryText}
                style={{
                  flex: 1,
                  color: theme.primaryText,
                }}
              />
              {biometricSupported && biometricAllowed && biometricsEnabled && (
                <Pressable onPress={handleBiometricLogin}>
                  {Platform.OS === "ios" ? (
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="scan-outline"
                        size={30}
                        color={theme.secondaryText}
                      />
                      <FontAwesome6
                        name="face-kiss"
                        size={10}
                        color={theme.secondaryText}
                        style={styles.overlayIcon}
                      />
                    </View>
                  ) : (
                    <Ionicons
                      name="finger-print"
                      size={24}
                      color={theme.secondaryText}
                    />
                  )}
                </Pressable>
              )}
            </View>
          </View>

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
                cursorColor={theme.primaryText}
                keyboardType="default"
                enterKeyHint="done"
                clearButtonMode="while-editing"
                autoComplete="password"
                clearTextOnFocus={false}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.secondaryText}
                secureTextEntry={!showPassword}
                style={{
                  flex: 1,
                  color: theme.primaryText,
                }}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Entypo name="eye" size={20} color={theme.secondaryText} />
                ) : (
                  <Entypo
                    name="eye-with-line"
                    size={20}
                    color={theme.secondaryText}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View>
            <Link href="/(open)/forgot-password">
              <Text
                style={{
                  color: theme.activeText,
                  textAlign: "right",
                  textDecorationLine: "underline",
                }}
              >
                Forgot Password?
              </Text>
            </Link>
          </View>

          <View style={styles.optionsRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Checkbox
                style={styles.checkbox}
                value={isTermsChecked}
                onValueChange={setIsTermsChecked}
                color={isTermsChecked ? theme.activeText : undefined}
              />
              <Text style={[styles.remember, { color: theme.tertiaryText }]}>
                I agree to the
                <Link href="https://smarthealthcaresolutions.com.au/terms-of-use">
                  <Text
                    style={{
                      color: theme.activeText,
                      textDecorationLine: "underline",
                    }}
                  >
                    {" "}
                    terms and conditions{" "}
                  </Text>
                </Link>
                &amp;
                <Link href="https://smarthealthcaresolutions.com.au/privacy-policy">
                  <Text
                    style={{
                      color: theme.activeText,
                      textDecorationLine: "underline",
                    }}
                  >
                    {" "}
                    privacy policy
                  </Text>
                </Link>
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.button,
              isLoginBusy && { opacity: 0.6 },
              {
                backgroundColor: theme.activeText,
                marginBottom: insets.bottom > 0 ? 0 : 8,
              },
            ]}
            onPress={handleLogin}
            disabled={isLoginBusy}
          >
            {isLoginBusy && (
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
            <Text style={[styles.buttonText, { color: theme.white }]}>
              {isLoginBusy ? "signing you in..." : "Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      backgroundColor: theme.whiteBackground,
    },
    bottomContainer: {
      width: "100%",
      flexGrow: 1,
      // height: "50%", // Remove fixed height to allow content to grow
      backgroundColor: theme.whiteBackground,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderTopRightRadius: 30,
      borderTopLeftRadius: 30,
      marginTop: -30,
    },
    iconContainer: {
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    overlayIcon: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -5 }, { translateY: -5 }],
    },
    image: {
      width: 120,
      height: 120,
      alignSelf: "center",
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    passwordInputGroup: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryText,
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
      color: theme.primaryText,
      fontWeight: "700",
      marginBottom: 6,
    },
    labelFilled: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "700",
      marginBottom: 6,
    },
    input: {
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryText,
      paddingVertical: 8,
      fontSize: 16,
    },
    inputFilled: {
      borderBottomWidth: 1,
      borderBottomColor: theme.primary,
      paddingVertical: 8,
      fontSize: 16,
    },
    optionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 16,
    },
    remember: {
      color: theme.secondaryText,
      fontSize: 14,
    },
    forgot: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    button: {
      backgroundColor: theme.primary,
      paddingVertical: 10,
      borderRadius: 4,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 6,
    },
    buttonText: {
      color: theme.white,
      fontSize: 16,
      fontWeight: "400",
    },
    footer: {
      marginTop: 20,
      color: theme.secondaryText,
    },
    signup: {
      color: theme.primary,
      fontWeight: "700",
    },
    checkbox: {
      margin: 4,
    },
  });
