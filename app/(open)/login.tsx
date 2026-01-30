import Entypo from "@expo/vector-icons/Entypo";
import { Checkbox } from "expo-checkbox";
// import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, isLoading } = useSession();

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
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View
        style={{
          backgroundColor: "#70C601",
          flex: 1,
        }}
      >
        <View style={styles.topContainer}></View>
        <View style={styles.topAbsContainer}>
          <View style={styles.topAbsContainerLeft}></View>
          <View style={styles.topAbsContainerRight}>
            <View style={styles.innerContainer}></View>
          </View>
        </View>

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
            <TextInput
              value={email}
              inputMode="email"
              autoComplete="email"
              clearButtonMode="while-editing"
              autoFocus={true}
              clearTextOnFocus={true}
              cursorColor="#70C601"
              enterKeyHint="next"
              placeholder="johnwilliams@gmail.com"
              onChangeText={setEmail}
              placeholderTextColor="#999"
              style={email ? styles.inputFilled : styles.input}
            />
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
                keyboardType="email-address"
                enterKeyHint="done"
                clearButtonMode="while-editing"
                autoComplete="password"
                clearTextOnFocus={true}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                style={{
                  flex: 1,
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Entypo name="eye" size={20} color="black" />
                ) : (
                  <Entypo name="eye-with-line" size={20} color="black" />
                )}
              </TouchableOpacity>
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
            <Text style={styles.buttonText}>
              {isLoading ? "Signing in..." : "Sign in"}
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
      </View>
      <View
        style={{
          backgroundColor: "#fff",
          height: "auto",
        }}
      ></View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topContainer: {
    height: "10%",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomContainer: {
    flex: 1,
    width: "100%",
    height: "auto",
    backgroundColor: "#ffffff",
    // justifyContent: "center",
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
    height: "30%",
    width: "100%",
    display: "flex",
    flexDirection: "row",
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
