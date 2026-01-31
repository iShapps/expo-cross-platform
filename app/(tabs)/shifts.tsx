import { PayrunCardBase } from "@/components/pay-run";
import { Payrun } from "@/data-types/dashboard";
import Feather from "@expo/vector-icons/Feather";
import Fontisto from "@expo/vector-icons/Fontisto";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

export default function Shifts() {
  const sample_payruns: Payrun[] = [
    {
      id: "1",
      period_start: "2026-01-31T09:00:00.000Z",
      period_end: "2026-01-31T19:00:00.000Z",
      status: "ongoing",
      total_hours: 8,
      total_amount: 1000,
      location: "21 Aldwych Way, Joondalup WA, Australia",
      category_id: "1",
      category_name: "Assistant in Nursing",
      facility_id: "1",
      facility_name: "MercyCare Joondalup",
    },
    {
      id: "2",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "170 Swansea St E, East Victoria Park WA 6101, Australia",
      category_id: "1",
      category_name: "Disability Support-Med/Peg/Dysphagia ",
      facility_id: "2",
      facility_name: "Brightwater Oats Street",
    },
    {
      id: "3",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
    {
      id: "4",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
    {
      id: "5",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
    {
      id: "6",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
    {
      id: "7",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
    {
      id: "8",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
    {
      id: "9",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
    {
      id: "10",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
      total_hours: 8,
      total_amount: 1000,
      location: "171 Albert Street, Osborne Park WA, Australia",
      category_id: "3",
      category_name: "Therapist Assistant",
      facility_id: "4",
      facility_name: "Amana James Brown Care  Centre",
    },
  ];
  return (
    <SafeAreaView
      style={Platform.OS === "ios" ? styles.container : styles.androidContainer}
    >
      <View style={styles.topBarContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIconContainer}
        >
          <Fontisto name="arrow-left-l" size={15} color="black" />
        </TouchableOpacity>
        <Text style={styles.locationText}>Shifts</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ ...styles.backIconContainer, borderColor: "white" }}
        >
          <Feather name="search" size={15} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        style={{ flex: 1 }}
        data={sample_payruns}
        renderItem={({ item }) => <PayrunCardBase payrun={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: 20,
          flexGrow: 1,
          gap: 5,
        }}
      />
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
    paddingHorizontal: 10,
  },
  topBarContainer: {
    display: "flex",
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
    paddingBottom: 10,
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
