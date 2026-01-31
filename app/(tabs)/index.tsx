import ActiveCard from "@/components/active-card";
import { PayrunCardBase } from "@/components/pay-run";
import { useProfileData } from "@/data-store/use-account-store";
import { Payrun } from "@/data-types/dashboard";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
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
    <View style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.containerTop}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Text style={styles.headerTitle}>{userDetails?.name}</Text>
            <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
              <FontAwesome6 name="location-dot" size={16} color="#FFC107" />
              <Text style={styles.headerSubtitle}>
                {userDetails?.hcp?.address}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            // onPress={() => router.push("/(main)/need")}
            style={styles.notificationContainer}
          >
            <MaterialIcons name="notifications" size={20} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.mainLandingContainer}>
        <ActiveCard payrun={sample_payruns[0]} />
        <FlatList
          style={{ flex: 1 }}
          data={sample_payruns}
          renderItem={({ item }) => <PayrunCardBase payrun={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 5,
            flexGrow: 1,
            gap: 5,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: "#70C601",
    width: "100%",
    flex: 1,
  },
  header: {
    backgroundColor: "#70C601",
    paddingTop: 55,
    paddingBottom: 10,
    alignItems: "center",
  },
  containerTop: {
    backgroundColor: "#70C601",
    height: "20%",
    width: "100%",
    paddingTop: 55,
    paddingBottom: 10,
    display: "flex",
    flexDirection: "column",
    paddingHorizontal: 10,
    gap: 10,
  },

  mainLandingContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
  },
  notificationContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    flexDirection: "row",
    borderRadius: 5,
    padding: 8,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 7,
    right: 11,
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
});
