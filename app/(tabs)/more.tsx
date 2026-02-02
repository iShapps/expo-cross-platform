import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useProfileData } from "@/data-store/use-account-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSession } from "../ctx";

export default function More() {
  const { signOut } = useSession();
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const handleLogout = () => {
    signOut();
    // router.replace("/(main)/index")
  };
  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="black" />
        </TouchableOpacity>
        <Text style={styles.locationText}>Profile</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.backIconContainer}
        >
          <AntDesign name="login" size={15} color="black" />
        </TouchableOpacity>
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: 5,
          flex: 1,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignContent: "center",
            alignItems: "center",
            gap: 4,
          }}
        >
          <View style={styles.serviceIContainer}>
            {userDetails?.hcp && userDetails?.hcp.image && (
              <Image
                source={{ uri: userDetails?.hcp.image }}
                style={{
                  height: "100%",
                  width: "100%",
                  overflow: "hidden",
                  objectFit: "cover",
                  borderRadius: 50,
                }}
              />
            )}
            {/* {!userDetails?.image_url && !profileImage &&
        <TouchableOpacity
      onPress={pickImage}
      style={{backgroundColor:"#f4f4f4", padding:4, borderRadius:50, width:60, height:60, display:"flex", flexDirection:"row", alignItems:"center", justifyContent:"center", marginVertical:10}}
      >
      <FontAwesome name="camera" size={24} color="gray" />
      </TouchableOpacity>}
      {profileImage && (
        <Image source={{uri:profileImage}} style={{height:"100%", width:"100%",overflow:"hidden",objectFit:"cover",borderRadius:50}}/>

      )} */}
          </View>
          {/* <Text>

        {(userDetails?.image_url || profileImage) &&
        <TouchableOpacity
        onPress={pickImage}
        style={{display:"flex", flexDirection:"row", alignItems:"center", justifyContent:"center", marginVertical:10}}
        >
        <Feather name="edit-2" size={15} color="black" />
        </TouchableOpacity>
        }
        </Text> */}
          <Text>{userDetails?.name && userDetails?.name}</Text>
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            width: "100%",
            marginVertical: 5,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/account")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <MaterialCommunityIcons
                name="account-cog-outline"
                size={24}
                color="#70C601"
              />
              <Text>Your profile</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/schedules")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <MaterialCommunityIcons
                name="office-building-marker"
                size={24}
                color="#70C601"
              />
              <Text>Facilities</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => router.push('/(main)/payments')} style={styles.profileLinks}>
          <View style={styles.profileContainer}>
          <FontAwesome5 name="credit-card" size={20} color="#70C601" />
          <Text>Payment Methods</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#70C601" />
        </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/schedules")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Ionicons
                name="calendar-clear-outline"
                size={24}
                color="#70C601"
              />
              <Text>Interviews</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/schedules")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Ionicons name="wallet" size={24} color="#70C601" />
              <Text>LMS</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/schedules")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Feather name="settings" size={24} color="#70C601" />
              <Text>Settings</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/schedules")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <FontAwesome name="link" size={24} color="#70C601" />
              <Text>Refer & Earn</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/schedules")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <AntDesign name="exclamation-circle" size={24} color="#70C601" />
              <Text>Help Center</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/schedules")}
            style={styles.profileLinks}
          >
            <View style={styles.profileContainer}>
              <Ionicons name="lock-closed" size={24} color="#70C601" />
              <Text>Privacy Policy</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#70C601"
            />
          </TouchableOpacity>
        </View>
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
    // justifyContent:"center",
    // alignContent:"center",
    // alignItems:"center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  serviceView: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    margin: 8,
  },
  serviceIContainer: {
    backgroundColor: "#f4f4f4",
    padding: 4,
    height: 100,
    width: 100,
    borderRadius: 50,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  truncatedText: {
    width: 50,
    overflow: "hidden",
    fontWeight: "bold",
    fontSize: 13,
    fontFamily: "Roboto",
  },
  profileContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 6,
    alignContent: "center",
    alignItems: "center",
    flex: 1,
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
  locationText: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
  },
  searchInputContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: 15,
    borderBottomColor: "#d3d3d3",
    borderBottomWidth: 1,
    paddingBottom: 25,
  },
  currentLocationContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    gap: 15,
    alignContent: "center",
    alignItems: "center",
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
  currentLocationText: {
    fontFamily: "Roboto",
    fontSize: 16,
    fontWeight: "500",
  },
  formLabelText: {
    color: "gray",
  },
  formInput: {
    backgroundColor: "#F4F4F4",
    borderRadius: 7,
    padding: 9,
  },
  formContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginVertical: 10,
  },
  formItemContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: "100%",
  },
  button: {
    backgroundColor: "#70C601",
    borderRadius: 22,
    padding: 12,
    color: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
  },

  dropdown: {
    backgroundColor: "#F4F4F4",
    borderRadius: 7,
    padding: 9,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
