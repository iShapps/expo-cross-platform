import Fontisto from "@expo/vector-icons/Fontisto";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <Pressable
          onPress={() => router.canGoBack() && router.back()}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="#fff" />
        </Pressable>
        <Text style={styles.locationText}>Settings</Text>
        <Pressable style={styles.faintbackIconContainer}></Pressable>
      </View>

      <View style={styles.linksContainer}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#70C601",
    display: "flex",
    flexDirection: "column",
    gap: 20,
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
  locationText: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  linksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: "100%",
    marginVertical: 5,
    backgroundColor: "#fff",
    flex: 1,
    paddingHorizontal: 10,
  },
});
