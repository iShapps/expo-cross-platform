import Entypo from "@expo/vector-icons/Entypo";
import Fontisto from "@expo/vector-icons/Fontisto";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <Pressable
          onPress={() => router.canGoBack() && router.back()}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="#fff" />
        </Pressable>
        <Text style={styles.locationText}>Change Password</Text>
        <Pressable style={styles.faintbackIconContainer}></Pressable>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={currentPassword ? styles.labelFilled : styles.label}>
            Current Password
          </Text>
          <View
            style={
              currentPassword
                ? styles.passwordInputGroupFilled
                : styles.passwordInputGroup
            }
          >
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              cursorColor="#70C601"
              style={{ flex: 1 }}
            />
            <Pressable
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <Entypo name="eye" size={20} color="#7393B3" />
              ) : (
                <Entypo name="eye-with-line" size={20} color="#7393B3" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={newPassword ? styles.labelFilled : styles.label}>
            New Password
          </Text>
          <View
            style={
              newPassword
                ? styles.passwordInputGroupFilled
                : styles.passwordInputGroup
            }
          >
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              cursorColor="#70C601"
              style={{ flex: 1 }}
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? (
                <Entypo name="eye" size={20} color="#7393B3" />
              ) : (
                <Entypo name="eye-with-line" size={20} color="#7393B3" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={confirmPassword ? styles.labelFilled : styles.label}>
            Confirm New Password
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
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              cursorColor="#70C601"
              style={{ flex: 1 }}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Entypo name="eye" size={20} color="#7393B3" />
              ) : (
                <Entypo name="eye-with-line" size={20} color="#7393B3" />
              )}
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Update Password</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#70C601",
    display: "flex",
    flexDirection: "column",
    // justifyContent:"center",
    // alignContent:"center",
    // alignItems:"center",
    // paddingHorizontal: 20,
    paddingVertical: 50,
  },
  topBarContainer: {
    display: "flex",
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
    backgroundColor: "#70C601",
    paddingHorizontal: 10,
  },

  locationText: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  backIconContainer: {
    height: 40,
    width: 40,
    borderRadius: 50,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    padding: 2,
    borderWidth: 1,
    borderColor: "#D3D3D3",
  },
  faintbackIconContainer: {
    height: 40,
    width: 40,
    borderRadius: 50,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    padding: 2,
    borderWidth: 1,
    borderColor: "#70C601",
  },
  backSpacer: {
    width: 52,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  formCard: {
    marginTop: 20,
    // borderRadius: 16,
    // padding: 16,
    // borderWidth: 1,
    // borderColor: "#F0F0F0",
    backgroundColor: "#fff",
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
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
  primaryButton: {
    marginTop: 16,
    backgroundColor: "#70C601",
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    // fontWeight: "700",
    fontSize: 14,
  },
});
