import {
  authenticateWithBiometrics,
  isBiometricAvailable,
} from "@/utils/biometrics";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Checkbox } from "expo-checkbox";
import { Image } from "expo-image";
import { Link } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSession } from "../ctx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isTermsChecked, setIsTermsChecked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading } = useSession();

  const [biometricSupported, setBiometricSupported] = useState(false);
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

  // Check for biometric support on mount
  useEffect(() => {
    (async () => {
      setBiometricSupported(await isBiometricAvailable());
    })();
  }, []);

  // Check for biometric support on mount
  useEffect(() => {
    (async () => {
      setBiometricSupported(await isBiometricAvailable());
    })();
  }, []);
  // TODO:encrypt stored credentials for production security(only token)
  const storeCredentials = async (email: string, password: string) => {
    await SecureStore.setItemAsync("ishapps_email", email);
    await SecureStore.setItemAsync("ishapps_password", password);
  };

  //Retrieve credentials for biometric login
  const getStoredCredentials = async () => {
    const storedEmail = await SecureStore.getItemAsync("ishapps_email");
    const storedPassword = await SecureStore.getItemAsync("ishapps_password");
    return { email: storedEmail, password: storedPassword };
  };

  const handleLogin = async () => {
    // check if terms are accepted
    if (!isTermsChecked) {
      Alert.alert(
        "Terms Required",
        "You must agree to the terms and privacy policy.",
        [{ text: "OK" }],
      );
      return;
    }
    try {
      await signIn({ email, password });
      // Ask for biometric consent after successful login
      if (biometricSupported) {
        Alert.alert(
          "Enable Biometric Login?",
          "Would you like to enable biometric login for future sign-ins? Your credentials will be securely stored.",
          [
            {
              text: "Yes",
              onPress: async () => {
                await storeCredentials(email, password);
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
      const creds = await getStoredCredentials();
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
    <View style={styles.container}>
      <View
        style={{
          backgroundColor: "#70C601",
          // flex: 1,
          height: "50%",
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
      {/* <View style={styles.topContainer}></View> */}
      {/* <View style={styles.topAbsContainer}>
          <View style={styles.topAbsContainerLeft}></View>
          <View style={styles.topAbsContainerRight}>
            <View style={styles.innerContainer}></View>
          </View>
        </View> */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.bottomContainer}>
          <View style={{ marginBottom: 20, marginTop: 10 }}>
            <Text
              style={{
                fontSize: 28,
                color: "#000",
                fontWeight: "700",
                marginBottom: 10,
              }}
            >
              Login
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#999",
              }}
            >
              Login to securely access your account and manage your shifts
              anytime.
            </Text>
          </View>

          {/* Email */}
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
                cursorColor="#70C601"
                enterKeyHint="next"
                placeholder="johnwilliams@gmail.com"
                onChangeText={setEmail}
                placeholderTextColor="#999"
                style={{
                  flex: 1,
                }}
              />
              <Pressable onPress={handleBiometricLogin}>
                {Platform.OS === "ios" ? (
                  <MaterialCommunityIcons
                    name="line-scan"
                    size={24}
                    color="#7393B3"
                  />
                ) : (
                  <Ionicons name="finger-print" size={24} color="#7393B3" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Password */}
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
                autoFocus={true}
                cursorColor="#70C601"
                keyboardType="default"
                enterKeyHint="done"
                clearButtonMode="while-editing"
                autoComplete="password"
                clearTextOnFocus={false}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                style={{
                  flex: 1,
                }}
              />
              {biometricSupported && (
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Entypo name="eye" size={20} color="#7393B3" />
                  ) : (
                    <Entypo name="eye-with-line" size={20} color="#7393B3" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View>
            <Link href="/(open)/forgot-password">
              <Text
                style={{
                  color: "#70C601",
                  textAlign: "right",
                  textDecorationLine: "underline",
                }}
              >
                Forgot Password?
              </Text>
            </Link>
          </View>

          {/* Options */}
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
                color={isTermsChecked ? "#70C601" : undefined}
              />
              <Text style={styles.remember}>
                I agree to the
                <Link href="https://www.ishapps.com/terms-of-service">
                  <Text
                    style={{
                      color: "#70C601",
                      textDecorationLine: "underline",
                    }}
                  >
                    {" "}
                    terms and conditions{" "}
                  </Text>
                </Link>
                &amp;
                <Link href="https://www.ishapps.com/privacy-policy">
                  <Text
                    style={{
                      color: "#70C601",
                      textDecorationLine: "underline",
                    }}
                  >
                    {" "}
                    privacy policy
                  </Text>
                </Link>
              </Text>
            </View>
            {/* <Text style={styles.forgot}>Forgot Password?</Text> */}
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.6 }]}
            onPress={handleLogin}
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
                <AntDesign name="loading-3-quarters" size={20} color="#fff" />
              </Animated.View>
            )}
            <Text style={styles.buttonText}>
              {isLoading ? "signing you in..." : "Sign in"}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          {/* <Text style={styles.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/(open)/sign-up">
              <Text
                style={{ color: "#70C601", textDecorationLine: "underline" }}
              >
                {" "}
                Create an account
              </Text>
            </Link>
          </Text> */}
        </View>
      </KeyboardAvoidingView>

      {/* <View
        style={{
          backgroundColor: "#fff",
          height: "auto",
        }}
      ></View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
  },
  topContainer: {
    height: "10%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4c5481",
  },
  bottomContainer: {
    flex: 1,
    width: "100%",
    // height: "50%",
    backgroundColor: "#ffffff",
    // justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    zIndex: 10,
    position: "absolute",
    bottom: 0,
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 16,
  },
  topAbsContainer: {
    height: "30%",
    width: "100%",
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#4601c6",
  },
  topAbsContainerLeft: {
    backgroundColor: "#70C601",
    height: "100%",
    width: "50%",
    marginTop: -50,
    borderTopLeftRadius: 55,
  },
  topAbsContainerRight: {
    backgroundColor: "white",
    height: "100%",
    width: "50%",
    marginTop: 10,
  },
  innerContainer: {
    height: "100%",
    width: "100%",
    backgroundColor: "#70C601",
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
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    fontSize: 16,
    gap: 8,
  },
  passwordInputGroupFilled: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#70C601",
    paddingVertical: 8,
    fontSize: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#000",
    fontWeight: "700",
    marginBottom: 6,
  },
  labelFilled: {
    fontSize: 14,
    color: "#70C601",
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    fontSize: 16,
  },

  inputFilled: {
    borderBottomWidth: 1,
    borderBottomColor: "#70C601",
    paddingVertical: 8,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },

  remember: {
    color: "#555",
    fontSize: 14,
  },

  forgot: {
    color: "#70C601",
    fontSize: 14,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#70C601",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
  },

  footer: {
    // textAlign: "center",
    marginTop: 20,
    color: "#555",
  },

  signup: {
    color: "#70C601",
    fontWeight: "700",
  },
  checkbox: {
    margin: 4,
  },
});
