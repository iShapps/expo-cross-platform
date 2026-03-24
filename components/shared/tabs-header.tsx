import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface TabsHeaderProps {
  title: string;
  right?: React.ReactNode;
}

const TabsHeader: React.FC<TabsHeaderProps> = ({ title, right }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {right && right}
    </View>
  );
};

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    header: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4,
      backgroundColor: theme.background,
      width: "100%",
      margin: 8,
      paddingTop: 12,
      paddingBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.whiteText,
    },
  });

export default TabsHeader;
