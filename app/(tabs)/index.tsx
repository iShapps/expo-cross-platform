import { Platform, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView
      style={Platform.OS === "ios" ? styles.container : styles.androidContainer}
    >
      <Text>Home Screen</Text>
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
    // justifyContent:"center",
    // alignContent:"center",
    // alignItems:"center",
    // paddingHorizontal:20,
    // paddingVertical:40
  },

  androidContainer: {
    flex: 1,
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    // justifyContent:"center",
    // alignContent:"center",
    // alignItems:"center",
    // paddingHorizontal:20,
    paddingTop: 50,
    paddingBottom: 70,
  },
});
