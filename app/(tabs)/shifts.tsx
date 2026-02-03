import { PayrunCardBase } from "@/components/pay-run";
import { Payrun } from "@/data-types/dashboard";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Shifts() {
  const shiftTypes = [
    "Morning",
    "Afternoon",
    "Night",
    "Sleepover",
    "Public Holiday",
    "Saturday",
    "Sunday",
  ];
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
      shift_type: shiftTypes[0],
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
      shift_type: shiftTypes[1],
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
      shift_type: shiftTypes[2],
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
      shift_type: shiftTypes[3],
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
      shift_type: shiftTypes[4],
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
      shift_type: shiftTypes[5],
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
      shift_type: shiftTypes[6],
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
      shift_type: shiftTypes[0],
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
      shift_type: shiftTypes[1],
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
      shift_type: shiftTypes[2],
    },
  ];
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shifts</Text>
          <View style={styles.underline} />
        </View>
        <FlatList
          // style={{ flex: 1 }}
          data={sample_payruns}
          renderItem={({ item }) => <PayrunCardBase payrun={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 10,
            flexGrow: 1,
            gap: 10,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  underline: {
    height: 3,
    width: 56,
    borderRadius: 999,
    backgroundColor: "#70C601",
    opacity: 0.85,
    marginTop: 6,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667085",
  },
  tabTextActive: {
    color: "#70C601",
  },
  tabUnderline: {
    height: 2,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "transparent",
    marginTop: 6,
  },
  tabUnderlineActive: {
    backgroundColor: "#70C601",
  },
});
