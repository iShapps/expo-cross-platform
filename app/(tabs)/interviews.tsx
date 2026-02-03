import Fontisto from "@expo/vector-icons/Fontisto";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function InterviewsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/more")}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="black" />
        </TouchableOpacity>
        <Text style={styles.locationText}>Interviews</Text>
        <TouchableOpacity
          style={styles.faintbackIconContainer}
        ></TouchableOpacity>
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
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: 30,
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  topBarContainer: {
    display: "flex",
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
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
    borderColor: "#fff",
  },
  locationText: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
  },
  linksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: "100%",
    marginVertical: 5,
  },
});
