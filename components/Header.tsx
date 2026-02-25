import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, right }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack}>
            <MaterialIcons
              name="chevron-left"
              size={30}
              color={theme.whiteText}
            />
          </Pressable>
        ) : (
          <View style={{ width: 18 }} />
        )}
        <Text style={styles.title}>{title}</Text>
        {right ? right : <View style={{ width: 18 }} />}
      </View>
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingVertical: 10,
      backgroundColor: theme.background,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.whiteText,
    },
  });

export default Header;
