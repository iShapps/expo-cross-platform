import { Fontisto } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SkeletonBase } from "./skeleton-base";

export const ShiftDetailsSkeleton: React.FC = () => {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.topBarContainer}>
          <Pressable
            onPress={() => router.canGoBack() && router.back()}
            style={styles.backIconContainer}
          >
            <Fontisto name="arrow-left-l" size={15} color="black" />
          </Pressable>
          <Text style={styles.locationText}>Shift Details</Text>
          <Pressable style={styles.faintbackIconContainer}></Pressable>
        </View>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    paddingHorizontal: 10,
    paddingVertical: 60,
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
  topBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  content: {
    paddingBottom: 32,
  },
  heroCard: {
    marginTop: 8,
    backgroundColor: "#F8FFF0",
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6F0D8",
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
    borderColor: "#F0F0F0",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
