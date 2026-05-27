import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationTestScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
  const [confettiKey, setConfettiKey] = React.useState(0);
  const repeatTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (repeatTimer.current) {
        clearTimeout(repeatTimer.current);
      }
    };
  }, []);

  const repeatConfetti = () => {
    repeatTimer.current = setTimeout(() => {
      setConfettiKey((key) => key + 1);
    }, 900);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ConfettiCannon
        key={confettiKey}
        count={90}
        origin={{ x: 0, y: -20 }}
        colors={["#70C601", "#FFD966", "#4A90E2", "#ff6f61", "#ffffff"]}
        explosionSpeed={420}
        fallSpeed={2800}
        fadeOut
        onAnimationEnd={repeatConfetti}
      />
      <View style={styles.content}>
        <View style={styles.checkOuter}>
          <View style={styles.checkInner}>
            <MaterialIcons name="verified" size={100} color={theme.primary} />
          </View>
        </View>

        <Text style={styles.title}>Notification test complete</Text>
        <Text style={styles.subtitle}>
          Your notifications are working correctly
        </Text>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Go to dashboard</Text>
          <MaterialIcons name="arrow-right-alt" size={20} color={theme.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.safeAreaBg,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    checkOuter: {
      width: 132,
      height: 132,
      borderRadius: 66,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${theme.primary}1A`,
      marginBottom: 28,
    },
    checkInner: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
      textAlign: "center",
      color: theme.primaryText,
      marginBottom: 10,
    },
    subtitle: {
      maxWidth: 300,
      fontSize: 16,
      lineHeight: 23,
      textAlign: "center",
      color: theme.secondaryText,
      marginBottom: 34,
    },
    button: {
      paddingVertical: 10,
      borderRadius: 50,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: theme.primary,
      shadowColor: theme.shadow ?? theme.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 4,
    },
    buttonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.white,
    },
  });
