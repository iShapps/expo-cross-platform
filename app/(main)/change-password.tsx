import { changePassword } from "@/api-queries/profile";
import Header from "@/components/Header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AntDesign } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../ctx";

export default function ChangePasswordScreen() {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const { signOut } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    onError: (error: any) => {
      const message = error?.response?.data?.message || "Something went wrong.";

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

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (changePasswordMutation.isPending) {
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
  }, [changePasswordMutation.isPending, spinAnim]);

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
              placeholderTextColor={theme.secondaryText}
              cursorColor={theme.primary}
              style={{
                flex: 1,
                color: theme.primaryText,
              }}
            />
            <Pressable
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <Entypo name="eye" size={20} color={theme.secondaryText} />
              ) : (
                <Entypo
                  name="eye-with-line"
                  size={20}
                  color={theme.secondaryText}
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
              placeholderTextColor={theme.secondaryText}
              cursorColor={theme.primary}
              style={{
                flex: 1,
                color: theme.primaryText,
              }}
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? (
                <Entypo name="eye" size={20} color={theme.secondaryText} />
              ) : (
                <Entypo
                  name="eye-with-line"
                  size={20}
                  color={theme.secondaryText}
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
              placeholderTextColor={theme.secondaryText}
              cursorColor={theme.primary}
              style={{
                flex: 1,
                color: theme.primaryText,
              }}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Entypo name="eye" size={20} color={theme.secondaryText} />
              ) : (
                <Entypo
                  name="eye-with-line"
                  size={20}
                  color={theme.secondaryText}
                />
              )}
            </Pressable>
          </View>
        </View>

        {formError && (
          <Text style={{ color: "red", marginBottom: 10 }}>{formError}</Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isInvalid || changePasswordMutation.isPending}
          style={[styles.primaryButton, isInvalid && { opacity: 0.5 }]}
        >
          {changePasswordMutation.isPending && (
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
          <Text style={styles.primaryButtonText}>
            {changePasswordMutation.isPending
              ? "Changing password..."
              : "Update Password"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    formCard: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      width: "100%",
      backgroundColor: theme.whiteBackground,
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
      borderBottomColor: theme.greyBorder,
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
      color: theme.primary,
      fontWeight: "700",
      marginBottom: 6,
    },
    primaryButton: {
      marginTop: 16,
      backgroundColor: theme.activeText,
      borderRadius: 5,
      paddingVertical: 12,
      alignItems: "center",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: theme.white,
      fontSize: 14,
    },
  });
