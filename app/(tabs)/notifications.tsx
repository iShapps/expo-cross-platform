import { NotificationCard } from "@/components/notification-card";
import { Notification } from "@/data-types/dashboard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const sample_notifications: Notification[] = [
    {
      id: "1",
      type: "shift_available",
      created_at: "2023-10-01T10:00:00.000Z",
      is_read: false,
      title: "New Shift Available",
      message: "A new shift is available at MercyCare Joondalup.",
    },
    {
      id: "2",
      type: "payment",
      created_at: "2023-09-28T14:30:00.000Z",
      is_read: true,
      title: "Payment Processed",
      message: "Your payment for the last payrun has been processed.",
    },
    {
      id: "3",
      type: "shift_reminder",
      created_at: "2023-09-30T08:00:00.000Z",
      is_read: false,
      title: "Shift Reminder",
      message: "Don't forget your shift tomorrow at Brightwater Oats Street.",
    },
    {
      id: "4",
      type: "general",
      created_at: "2023-10-02T07:15:00.000Z",
      is_read: true,
      title: "Profile Updated",
      message: "Your profile details were updated successfully.",
    },
    {
      id: "5",
      type: "shift_available",
      created_at: "2023-10-02T09:45:00.000Z",
      is_read: false,
      title: "Extra Shift Added",
      message: "An extra evening shift is available at Regis Lake Park.",
    },
    {
      id: "6",
      type: "payment",
      created_at: "2023-10-03T12:10:00.000Z",
      is_read: true,
      title: "Payslip Ready",
      message: "Your payslip for the current period is ready to view.",
    },
    {
      id: "7",
      type: "shift_reminder",
      created_at: "2023-10-03T17:30:00.000Z",
      is_read: false,
      title: "Shift Starts Soon",
      message: "Your shift at Brightwater Oats Street starts in 2 hours.",
    },
    {
      id: "8",
      type: "general",
      created_at: "2023-10-04T08:05:00.000Z",
      is_read: true,
      title: "App Update",
      message: "A new version is available with performance improvements.",
    },
  ];

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          {/* <View style={styles.underline} /> */}
        </View>

        <FlatList
          data={sample_notifications}
          renderItem={({ item }) => <NotificationCard notification={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 5,
            flexGrow: 1,
            gap: 5,
            backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
            paddingHorizontal: 10,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    safeArea: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      width: "100%",
      margin: 8,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colorScheme === "dark" ? "#fff" : "#ffffff",
    },
    underline: {
      height: 3,
      width: 56,
      borderRadius: 999,
      backgroundColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
      opacity: 0.85,
      marginTop: 6,
    },
    listContent: {
      paddingBottom: 24,
      gap: 8,
    },
  });
