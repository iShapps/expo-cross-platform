import { Platform, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function More() {
  return (
    <SafeAreaView
      style={Platform.OS === "ios" ? styles.container : styles.androidContainer}
    >
      <Text>More Screen</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },

  androidContainer: {
    flex: 1,
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    paddingTop: 50,
    paddingBottom: 70,
  },
});
