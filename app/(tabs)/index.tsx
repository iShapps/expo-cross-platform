import { PayrunCard } from "@/components/pay-run-card";
import { Payrun } from "@/data-types/dashboard";
import { FlatList, Platform, StyleSheet, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const sample_payruns: Payrun[] = [
    {
      id: "1",
      period_start: "2023-01-01T00:00:00.000Z",
      period_end: "2023-01-01T00:00:00.000Z",
      status: "current",
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
    <SafeAreaProvider>
      <SafeAreaView
        style={
          Platform.OS === "ios" ? styles.container : styles.androidContainer
        }
      >
        <Text>Home Screen</Text>
        {/* <PayrunCard payrun={sample_payruns[0]} /> */}
        <FlatList
          data={sample_payruns}
          renderItem={({ item }) => <PayrunCard payrun={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 5,
            paddingHorizontal: 10,
            gap: 5,
            // flex: 1,
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
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
    backgroundColor: "#ffffff",
    // justifyContent:"center",
    // alignContent:"center",
    // alignItems:"center",
    // paddingHorizontal:20,
    paddingTop: 50,
    paddingBottom: 70,
  },
});
