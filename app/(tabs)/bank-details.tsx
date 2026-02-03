import { useProfileData } from "@/data-store/use-account-store";
import Fontisto from "@expo/vector-icons/Fontisto";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BankDetailsScreen() {
  const profileStore = useProfileData();
  const hcp = profileStore.userDetails?.hcp;

  const items = [
    { label: "Bank name", value: hcp?.bank_name },
    { label: "Branch", value: hcp?.branch_name_and_address },
    { label: "Account name", value: hcp?.account_name },
    { label: "Account number", value: hcp?.account_number },
    { label: "BSB", value: hcp?.bsb_number },
    {
      label: "Super fund",
      value: hcp?.superannuation_detail_fund_name,
    },
    {
      label: "Super member no.",
      value: hcp?.superannuation_detail_membership_no,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/account")}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="black" />
        </TouchableOpacity>
        <Text style={styles.locationText}>Bank Details</Text>
        <TouchableOpacity
          style={styles.faintbackIconContainer}
        ></TouchableOpacity>
      </View>

      <View style={styles.card}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value ?? "Not available"}</Text>
          </View>
        ))}
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
    paddingHorizontal: 10,
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
  card: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#f4f4f4",
    padding: 12,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f4",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginTop: 4,
  },
});
