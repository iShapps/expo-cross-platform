import {
  ActiveCardSkeleton,
  DashboardAnalyticsSkeleton,
  NotificationCardSkeleton,
  ShiftCardBaseSkeleton,
} from "@/components/skeletons";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SKELETON_DATA = Array.from({ length: 2 }, (_, index) => ({
  id: `skeleton-${index}`,
}));

export default function DocumentsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My documents</Text>
          <View style={styles.underline} />
        </View>
        <DashboardAnalyticsSkeleton />
        <ActiveCardSkeleton />
        <FlatList
          data={SKELETON_DATA}
          renderItem={() => <ShiftCardBaseSkeleton />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 10,
            flexGrow: 1,
            gap: 10,
          }}
        />
        <FlatList
          data={SKELETON_DATA}
          renderItem={() => <NotificationCardSkeleton />}
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
