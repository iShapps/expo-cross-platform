import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AccountScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/more")}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="black" />
        </TouchableOpacity>
        <Text style={styles.locationText}>Account</Text>
        <TouchableOpacity
          // onPress={() => router.replace("/(tabs)/more")}
          style={styles.faintbackIconContainer}
        >
          {/* <AntDesign name="close" size={16} color="black" /> */}
        </TouchableOpacity>
      </View>

      <View style={styles.linksContainer}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.profileLinks}
        >
          <View style={styles.profileContainer}>
            <MaterialCommunityIcons
              name="account-cog-outline"
              size={24}
              color="#70C601"
            />
            <Text>My account</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#70C601"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/bank-details")}
          style={styles.profileLinks}
        >
          <View style={styles.profileContainer}>
            <MaterialCommunityIcons name="bank" size={24} color="#70C601" />
            <Text>Bank details</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#70C601"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/change-password")}
          style={styles.profileLinks}
        >
          <View style={styles.profileContainer}>
            <MaterialCommunityIcons
              name="lock-reset"
              size={24}
              color="#70C601"
            />
            <Text>Change password</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#70C601"
          />
        </TouchableOpacity>
      </View>
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
  profileLinks: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    alignItems: "center",
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f4",
    paddingVertical: 12,
  },
  profileContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 6,
    alignContent: "center",
    alignItems: "center",
    flex: 1,
  },
});
