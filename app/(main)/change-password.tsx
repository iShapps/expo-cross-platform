import Header from "@/components/Header";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Change Password" onBack={() => router.back()} />

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
              placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#999"}
              cursorColor={colorScheme === "dark" ? "#b0b8ca" : "#70C601"}
              style={{
                flex: 1,
                color: colorScheme === "dark" ? "#b0b8ca" : undefined,
              }}
            />
            <Pressable
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <Entypo
                  name="eye"
                  size={20}
                  color={colorScheme === "dark" ? "#b0b8ca" : "#7393B3"}
                />
              ) : (
                <Entypo
                  name="eye-with-line"
                  size={20}
                  color={colorScheme === "dark" ? "#b0b8ca" : "#7393B3"}
                />
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
              placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#999"}
              cursorColor={colorScheme === "dark" ? "#b0b8ca" : "#70C601"}
              style={{
                flex: 1,
                color: colorScheme === "dark" ? "#b0b8ca" : undefined,
              }}
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? (
                <Entypo
                  name="eye"
                  size={20}
                  color={colorScheme === "dark" ? "#b0b8ca" : "#7393B3"}
                />
              ) : (
                <Entypo
                  name="eye-with-line"
                  size={20}
                  color={colorScheme === "dark" ? "#b0b8ca" : "#7393B3"}
                />
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
              placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#999"}
              cursorColor={colorScheme === "dark" ? "#b0b8ca" : "#70C601"}
              style={{
                flex: 1,
                color: colorScheme === "dark" ? "#b0b8ca" : undefined,
              }}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Entypo
                  name="eye"
                  size={20}
                  color={colorScheme === "dark" ? "#b0b8ca" : "#7393B3"}
                />
              ) : (
                <Entypo
                  name="eye-with-line"
                  size={20}
                  color={colorScheme === "dark" ? "#b0b8ca" : "#7393B3"}
                />
              )}
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Update Password</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    formCard: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      width: "100%",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      flex: 1,
      paddingHorizontal: 12,
      paddingTop: 16,
    },

    inputGroup: {
      marginBottom: 16,
    },
    passwordInputGroup: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#b0b8ca" : "#ccc",
      paddingVertical: 8,
      fontSize: 16,
      gap: 8,
    },
    passwordInputGroupFilled: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#b0b8ca" : "#70C601",
      paddingVertical: 8,
      fontSize: 16,
      gap: 8,
    },
    label: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#b0b8ca" : "#000",
      fontWeight: "700",
      marginBottom: 6,
    },
    labelFilled: {
      fontSize: 14,
      color: colorScheme === "dark" ? "#fff" : "#70C601",
      fontWeight: "700",
      marginBottom: 6,
    },
    primaryButton: {
      marginTop: 16,
      backgroundColor: colorScheme === "dark" ? "#b0b8ca" : "#70C601",
      borderRadius: 5,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonText: {
      color: colorScheme === "dark" ? "#232A2E" : "#fff",
      fontSize: 14,
    },
  });
