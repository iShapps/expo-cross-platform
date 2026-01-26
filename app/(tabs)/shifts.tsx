import { Platform, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Shifts() {
  return (
    <SafeAreaView
      style={Platform.OS === "ios" ? styles.container : styles.androidContainer}
    >
      <Text>Shifts Screen</Text>
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
    backgroundColor: "#ffffff",
  },

  androidContainer: {
    flex: 1,
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    paddingTop: 50,
    paddingBottom: 70,
  },
});
