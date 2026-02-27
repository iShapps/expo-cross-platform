import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../Header";
import { SkeletonBase } from "./skeleton-base";

export const ShiftDetailsSkeleton: React.FC = () => {
  const router = useRouter();
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);
  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: colorScheme === "dark" ? "#232A2E" : "#70C601",
      }}
    >
      <Header
        title="Shift Details"
        onBack={() => router.canGoBack() && router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <SkeletonBase width={64} height={64} borderRadius={6} />
          <View style={styles.heroContent}>
            <SkeletonBase width="70%" height={16} borderRadius={4} />
            <SkeletonBase
              width="85%"
              height={12}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
            <SkeletonBase
              width="60%"
              height={12}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
            <View style={styles.chipRow}>
              <SkeletonBase width={80} height={20} borderRadius={10} />
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SkeletonBase width={120} height={12} borderRadius={4} />
          <View style={styles.detailRow}>
            <SkeletonBase width={60} height={10} borderRadius={4} />
            <SkeletonBase
              width={140}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={styles.detailRow}>
            <SkeletonBase width={60} height={10} borderRadius={4} />
            <SkeletonBase
              width={180}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={styles.detailRow}>
            <SkeletonBase width={60} height={10} borderRadius={4} />
            <SkeletonBase
              width={110}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={styles.detailRowNoBorder}>
            <SkeletonBase width={60} height={10} borderRadius={4} />
            <SkeletonBase
              width={90}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SkeletonBase width={110} height={12} borderRadius={4} />
          <View style={styles.detailRow}>
            <SkeletonBase width={70} height={10} borderRadius={4} />
            <SkeletonBase
              width={140}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={styles.detailRow}>
            <SkeletonBase width={70} height={10} borderRadius={4} />
            <SkeletonBase
              width={160}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={styles.detailRowNoBorder}>
            <SkeletonBase width={70} height={10} borderRadius={4} />
            <SkeletonBase
              width={120}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SkeletonBase width={120} height={12} borderRadius={4} />
          <View style={styles.detailRow}>
            <SkeletonBase width={80} height={10} borderRadius={4} />
            <SkeletonBase
              width={90}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={styles.detailRow}>
            <SkeletonBase width={80} height={10} borderRadius={4} />
            <SkeletonBase
              width={60}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <View style={styles.detailRowNoBorder}>
            <SkeletonBase width={80} height={10} borderRadius={4} />
            <SkeletonBase
              width={70}
              height={14}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
          <SkeletonBase
            width={180}
            height={10}
            borderRadius={4}
            style={{ marginTop: 10 }}
          />
        </View>

        <View style={styles.sectionCard}>
          <SkeletonBase width={150} height={12} borderRadius={4} />
          <View style={styles.timelineContainer}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={styles.timelineItemWrap}>
                <View style={styles.timelineIconColumn}>
                  <SkeletonBase
                    width={2}
                    height={26}
                    borderRadius={1}
                    style={styles.timelineLineTop}
                  />
                  <SkeletonBase width={40} height={40} borderRadius={20} />
                  <SkeletonBase
                    width={2}
                    height={26}
                    borderRadius={1}
                    style={styles.timelineLineBottom}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <SkeletonBase width={120} height={12} borderRadius={4} />
                  <SkeletonBase
                    width={80}
                    height={12}
                    borderRadius={4}
                    style={{ marginTop: 6 }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    content: {
      paddingBottom: 32,
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#ffffff",
      paddingHorizontal: 10,
    },
    heroCard: {
      marginTop: 8,
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#F8FFF0",
      borderRadius: 5,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#E6F0D8",
      marginBottom: 12,
    },
    heroContent: {
      flex: 1,
    },
    chipRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
      marginBottom: -8,
    },
    sectionCard: {
      marginTop: 12,
      borderRadius: 5,
      padding: 14,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#F0F0F0",
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      marginBottom: 8,
    },
    detailRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#36454F" : "#F3F4F6",
    },
    detailRowNoBorder: {
      paddingVertical: 8,
    },
    timelineContainer: {
      marginTop: 8,
      paddingLeft: 18,
    },
    timelineItemWrap: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 75,
    },
    timelineIconColumn: {
      width: 36,
      alignItems: "center",
      position: "relative",
      minHeight: 75,
      justifyContent: "center",
    },
    timelineLineTop: {
      position: "absolute",
      top: 0,
    },
    timelineLineBottom: {
      position: "absolute",
      bottom: 0,
    },
    timelineContent: {
      flex: 1,
      marginLeft: 8,
      flexDirection: "column",
      justifyContent: "center",
    },
  });
