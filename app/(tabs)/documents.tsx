import { postProfile } from "@/api-queries/profile";
import DocumentCard from "@/components/document-card";
import { DocumentCardSkeleton } from "@/components/skeletons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatDocumentType = (docType: string): string => {
  const typeMap: Record<string, string> = {
    profession: "Professional",
    "general-statement": "General",
  };

  return typeMap[docType] || docType;
};

export default function DocumentsScreen() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    // isRefetchError,
    error: documentError,
  } = useQuery({
    queryKey: ["profile-details"],
    queryFn: () => postProfile(),
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 60 * 24,
    refetchIntervalInBackground: true,
  });

  const documents = useMemo(() => {
    return data?.data?.hcp?.documents ?? [];
  }, [data?.data?.hcp?.documents]);

  // Extract unique document types from the documents
  const documentTypes = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(documents.map((doc: any) => doc.doc_type))).filter(
        Boolean,
      ),
    ] as string[];
  }, [documents]);

  const [activeDocType, setActiveDocType] = useState<string>("All");
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentScrollRef = useRef<ScrollView>(null);

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveDocType(documentTypes[index]);
      contentScrollRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    },
    [screenWidth, documentTypes],
  );

  const handleContentScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      const clampedIndex = Math.min(
        Math.max(index, 0),
        documentTypes.length - 1,
      );
      setActiveDocType(documentTypes[clampedIndex]);
    },
    [screenWidth, documentTypes],
  );

  const handlePullToRefresh = async () => {
    await refetch();
  };

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>My documents</Text>
        {/* <View style={styles.underline} /> */}
      </View>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {documentTypes.map((docType, index) => {
            const isActive = activeDocType === docType;
            return (
              <TouchableOpacity
                key={docType}
                onPress={() => handleTabPress(index)}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {formatDocumentType(docType)}
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    isActive && styles.tabUnderlineActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          ref={contentScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleContentScrollEnd}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {}}
        >
          {documentTypes.map((docType, index) => (
            <View
              key={docType}
              style={{ width: screenWidth - 24, paddingHorizontal: 4 }}
            >
              {(() => {
                // Filter documents by type
                const filteredDocuments =
                  docType === "All"
                    ? documents
                    : documents.filter((doc: any) => doc.doc_type === docType);

                if (isLoading) {
                  return (
                    <FlatList
                      data={[...Array(6)]}
                      renderItem={() => <DocumentCardSkeleton />}
                      keyExtractor={(_, idx) => `skeleton-${idx}`}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingBottom: 120,
                        paddingTop: 10,
                        minHeight: screenHeight,
                        gap: 4,
                      }}
                      refreshing={isRefetching}
                      onRefresh={handlePullToRefresh}
                    />
                  );
                }

                if (isError) {
                  return (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={72}
                        color="#ff6f61"
                        style={{ marginBottom: 16 }}
                      />
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: "#ff6f61",
                          marginBottom: 8,
                        }}
                      >
                        Error Loading Documents
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#818589",
                          textAlign: "center",
                          maxWidth: 260,
                          marginBottom: 12,
                        }}
                      >
                        Something went wrong while fetching documents. Please
                        pull to refresh or try again later. (
                        {documentError instanceof Error && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#818589",
                              textAlign: "center",
                            }}
                          >
                            {documentError.message}
                          </Text>
                        )}
                        )
                      </Text>
                      <Pressable
                        onPress={handlePullToRefresh}
                        style={{
                          backgroundColor: "#FBF2F2",
                          paddingHorizontal: 24,
                          paddingVertical: 10,
                          borderRadius: 20,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <FontAwesome6
                          name="rotate-left"
                          size={20}
                          color="#71797E"
                        />
                        <Text
                          style={{
                            color: "#71797E",
                            fontSize: 16,
                            fontWeight: "700",
                          }}
                        >
                          Retry
                        </Text>
                      </Pressable>
                    </View>
                  );
                }

                if (!isLoading && filteredDocuments.length === 0) {
                  return (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="calendar-remove-outline"
                        size={72}
                        color="#e0e0e0"
                        style={{ marginBottom: 16 }}
                      />
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: "#70C601",
                          marginBottom: 8,
                        }}
                      >
                        No Documents Yet
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#818589",
                          textAlign: "center",
                          maxWidth: 260,
                        }}
                      >
                        There are no{" "}
                        {docType === "All" ? "" : docType.toLowerCase()}{" "}
                        documents at the moment. Check back later or explore
                        other tabs!
                      </Text>
                    </View>
                  );
                }

                return (
                  <FlatList
                    data={filteredDocuments}
                    renderItem={({ item }) => <DocumentCard document={item} />}
                    keyExtractor={(item, idx) => String(`${idx}-${item.id}`)}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingBottom: 120,
                      paddingTop: 10,
                      minHeight: screenHeight,
                      gap: 4,
                    }}
                    refreshing={isRefetching}
                    onRefresh={handlePullToRefresh}
                    onEndReachedThreshold={0.6}
                  />
                );
              })()}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    container: {
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#ffffff",
      paddingHorizontal: 10,
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
      paddingHorizontal: 10,
      paddingTop: 12,
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
    tabsRow: {
      flexDirection: "row",
      gap: 8,
    },
    tabButton: {
      paddingVertical: 6,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#fff" : "#667085",
    },
    tabTextActive: {
      color: colorScheme === "dark" ? "#fff" : "#70C601",
    },
    tabUnderline: {
      height: 2,
      width: "100%",
      borderRadius: 999,
      backgroundColor: "transparent",
      marginTop: 6,
    },
    tabUnderlineActive: {
      backgroundColor: colorScheme === "dark" ? "#FFD966" : "#70C601",
    },
  });
