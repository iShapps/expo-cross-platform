import OTPInput, { useOTPInput } from "@/components/shared/otp-input";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import { Checkbox } from "expo-checkbox";
// import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { otp, handleChange, handleComplete } = useOTPInput(6);

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
              Sign Up
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#999",
              }}
            >
              Create an account to securely access and manage your shifts and
              schedules.
            </Text>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={email ? styles.labelFilled : styles.label}>
                Email Address
              </Text>

              <TouchableOpacity onPress={() => setShowModal(true)}>
                <Text
                  style={{
                    color: "#70C601",
                    fontSize: 12,
                  }}
                >
                  Verify email
                </Text>
              </TouchableOpacity>
            </View>
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
          <View style={styles.inputGroup}>
            <Text style={password ? styles.labelFilled : styles.label}>
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
                autoFocus={true}
                cursorColor="#70C601"
                keyboardType="email-address"
                enterKeyHint="done"
                clearButtonMode="while-editing"
                autoComplete="password"
                clearTextOnFocus={true}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                style={{
                  flex: 1,
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showPassword ? (
                  <Entypo name="eye" size={20} color="black" />
                ) : (
                  <Entypo name="eye-with-line" size={20} color="black" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={inviteCode ? styles.labelFilled : styles.label}>
              Invite Code (Optional)
            </Text>
            <TextInput
              value={inviteCode}
              clearButtonMode="while-editing"
              autoFocus={true}
              clearTextOnFocus={true}
              cursorColor="#70C601"
              enterKeyHint="next"
              placeholder="invite code"
              onChangeText={setInviteCode}
              placeholderTextColor="#999"
              style={inviteCode ? styles.inputFilled : styles.input}
            />
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
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            Already have an account?{" "}
            <Link href="/(open)/login">
              <Text
                style={{ color: "#70C601", textDecorationLine: "underline" }}
              >
                {" "}
                Login to your account
              </Text>
            </Link>
          </Text>
        </View>
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
                  <AntDesign name="close" size={20} color="#70C601" />
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
                    <MaterialIcons name="verified" size={60} color="#70C601" />
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
                  Enter the 4-digit verification code sent to your email
                  address.
                </Text>

                <OTPInput
                  onChange={handleChange}
                  onComplete={handleComplete}
                  length={6}
                  // containerStyle={styles.customContainer}
                  // inputStyle={styles.customInput}
                  // focusedInputStyle={styles.customFocusedInput}
                  // filledInputStyle={styles.customFilledInput}
                />

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4,
                    marginVertical: 10,
                  }}
                >
                  <Text>Didn&apos;t get the code?</Text>
                  <Text
                    style={{
                      color: "#70C601",
                      fontSize: 14,
                      fontWeight: "600",
                      textDecorationLine: "underline",
                    }}
                  >
                    Resend
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton}>
                  <Text style={styles.buttonText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    width: "92%",
  },
  topContainer: {
    height: "10%",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomContainer: {
    flex: 1,
    height: "auto",
    width: "100%",
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
    height: "15%",
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

  modalButton: {
    backgroundColor: "#70C601",
    paddingVertical: 10,
    borderRadius: 5,
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
