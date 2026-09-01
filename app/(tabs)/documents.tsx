import {
  getDutyStatementDocuments,
  getGenaralStatementDocuments,
  getProfessionDocuments,
} from "@/api-queries/documents";
import DocumentCard from "@/components/document-card";
import TabsHeader from "@/components/shared/tabs-header";
import { DocumentCardSkeleton } from "@/components/skeletons";
import { Colors, Radii } from "@/constants/theme";
import { IDocument } from "@/data-types/documents";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
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
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";

const WalkthroughableView = walkthroughable(View);

const useShiftInfiniteQuery = (
  key: string,
  queryFn: (page?: number) => Promise<any>,
) => {
  return useInfiniteQuery({
    queryKey: [key],
    queryFn: ({ pageParam = 1 }) => queryFn(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.shifts;
      if (!pagination) return undefined;
      if (pagination.current_page < pagination.last_page) {
        return pagination.current_page + 1;
      }
      return undefined;
    },
    refetchInterval: 30 * 60 * 1000,
    refetchIntervalInBackground: true,
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export default function DocumentsScreen() {
  const documentTabs = ["General", "Professional", "Others"] as const;
  const [activeStatus, setActiveStatus] =
    useState<(typeof documentTabs)[number]>("General");

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentScrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const tabOffsetsRef = useRef<number[]>([]);
  const tabWidthsRef = useRef<number[]>([]);

  const generalQuery = useShiftInfiniteQuery(
    "general-documents",
    getGenaralStatementDocuments,
  );

  const dutyQuery = useShiftInfiniteQuery(
    "duty-statement-documents",
    getDutyStatementDocuments,
  );

  const professionQuery = useShiftInfiniteQuery(
    "profession-documents",
    getProfessionDocuments,
  );

  const scrollTabIntoView = useCallback(
    (index: number) => {
      const offset = tabOffsetsRef.current[index];
      const width = tabWidthsRef.current[index];
      if (offset == null || width == null) return;
      tabScrollRef.current?.scrollTo({
        x: offset - screenWidth / 2 + width / 2,
        animated: true,
      });
    },
    [screenWidth],
  );

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveStatus(documentTabs[index]);
      scrollTabIntoView(index);
      contentScrollRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    },
    [screenWidth, scrollTabIntoView],
  );

  const handleContentScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      const clampedIndex = Math.min(
        Math.max(index, 0),
        documentTabs.length - 1,
      );
      setActiveStatus(documentTabs[clampedIndex]);
      scrollTabIntoView(clampedIndex);
    },
    [screenWidth, scrollTabIntoView],
  );

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);

  const isFocused = useIsFocused();

  useFirstVisitTour("documents", isFocused && !generalQuery.isLoading);

  return (
    <SafeAreaView style={styles.safeArea}>
      <TabsHeader title="My documents" />
      <View style={styles.container}>
        <CopilotStep
          name="documents-tabs"
          order={1}
          active={isFocused}
          text="Documents are grouped into General, Professional, and Others — switch tabs to see what's required in each category."
        >
          <WalkthroughableView>
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {documentTabs.map((status, index) => {
                const isActive = activeStatus === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => handleTabPress(index)}
                    style={styles.tabButton}
                    android_ripple={{ color: "#ccc" }}
                    onLayout={(e) => {
                      tabOffsetsRef.current[index] = e.nativeEvent.layout.x;
                      tabWidthsRef.current[index] = e.nativeEvent.layout.width;
                    }}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        isActive && styles.tabTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                    <View
                      style={[
                        styles.tabUnderline,
                        isActive && styles.tabUnderlineActive,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </WalkthroughableView>
        </CopilotStep>
        {/* <FlatList
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
        /> */}

        {/* Horizontal paging ScrollView for tab content */}
        <ScrollView
          ref={contentScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleContentScrollEnd}
          onScrollBeginDrag={() => {}} // prevent flicker
        >
          {documentTabs.map((status, index) => (
            <View
              key={status}
              style={{ width: screenWidth - 16, paddingHorizontal: 4 }}
            >
              {(() => {
                let isLoading = false;
                let data: IDocument[] = [];
                let refetchFn = undefined as undefined | (() => Promise<any>);
                let isError = false;
                let shiftError: any = null;
                let isFetchingNextPage = false;
                let hasNextPage = false;
                let fetchNextPage: undefined | (() => Promise<any>) = undefined;
                let isRefetching = false;
                switch (status) {
                  case "General":
                    isLoading = generalQuery.isLoading;
                    data =
                      generalQuery.data?.pages.flatMap(
                        (page) => page?.data?.hcps?.data ?? [],
                      ) || [];
                    isError = generalQuery.isError;
                    shiftError = generalQuery.error;
                    refetchFn = generalQuery.refetch;
                    isFetchingNextPage = generalQuery.isFetchingNextPage;
                    hasNextPage = !!generalQuery.hasNextPage;
                    fetchNextPage = generalQuery.fetchNextPage;
                    isRefetching = generalQuery.isRefetching;
                    break;
                  case "Others":
                    isLoading = dutyQuery.isLoading;
                    data =
                      dutyQuery.data?.pages.flatMap(
                        (page) => page?.data?.hcps?.data ?? [],
                      ) || [];
                    isError = dutyQuery.isError;
                    shiftError = dutyQuery.error;
                    refetchFn = dutyQuery.refetch;
                    isFetchingNextPage = dutyQuery.isFetchingNextPage;
                    hasNextPage = !!dutyQuery.hasNextPage;
                    fetchNextPage = dutyQuery.fetchNextPage;
                    isRefetching = dutyQuery.isRefetching;
                    break;
                  case "Professional":
                    isLoading = professionQuery.isLoading;
                    data =
                      professionQuery.data?.pages.flatMap(
                        (page) => page?.data?.hcps?.data ?? [],
                      ) || [];
                    isError = professionQuery.isError;
                    shiftError = professionQuery.error;
                    refetchFn = professionQuery.refetch;
                    isFetchingNextPage = professionQuery.isFetchingNextPage;
                    hasNextPage = !!professionQuery.hasNextPage;
                    fetchNextPage = professionQuery.fetchNextPage;
                    isRefetching = professionQuery.isRefetching;
                    break;
                  default:
                    data = [];
                }
                const handlePullToRefresh = async () => {
                  if (refetchFn) await refetchFn();
                };
                const handleLoadMore = () => {
                  if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
                    fetchNextPage();
                  }
                };
                if (isLoading) {
                  return (
                    <FlatList
                      data={Array.from({ length: 5 })}
                      renderItem={() => <DocumentCardSkeleton />}
                      keyExtractor={(_, idx) => `skeleton-${idx}`}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingBottom: 120,
                        paddingTop: 10,
                        minHeight: screenHeight,
                        gap: 10,
                      }}
                      refreshing={isRefetching && !isFetchingNextPage}
                      onRefresh={handlePullToRefresh}
                    />
                  );
                }

                if (isError) {
                  return (
                    <View
                      style={{
                        // flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="folder"
                        size={72}
                        color={theme.danger}
                        style={{ marginBottom: 16 }}
                      />
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: theme.danger,
                          marginBottom: 8,
                        }}
                      >
                        Error Loading Documents
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: theme.secondaryText,
                          textAlign: "center",
                          maxWidth: 260,
                          marginBottom: 12,
                        }}
                      >
                        Something went wrong while fetching{" "}
                        <Text style={{ textTransform: "lowercase" }}>
                          {status}
                        </Text>{" "}
                        documents. Please pull to refresh or try again later. (
                        {shiftError instanceof Error && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: theme.secondaryText,
                              textAlign: "center",
                            }}
                          >
                            {shiftError.message}
                          </Text>
                        )}
                        )
                      </Text>
                      <TouchableOpacity
                        onPress={handlePullToRefresh}
                        style={{
                          backgroundColor: "#FBF2F2",
                          paddingHorizontal: 24,
                          paddingVertical: 10,
                          borderRadius: Radii.full,
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
                      </TouchableOpacity>
                    </View>
                  );
                }

                return (
                  <FlatList
                    data={data}
                    renderItem={({ item, index }) =>
                      status === "General" && index === 0 ? (
                        <CopilotStep
                          name="documents-first-card"
                          order={2}
                          active={isFocused}
                          text="The dot shows if a document's active or needs attention, and the chips tell you if it's mandatory and whether it needs an expiry date. Tap it to preview or upload/replace the file."
                        >
                          <WalkthroughableView>
                            <DocumentCard document={item} />
                          </WalkthroughableView>
                        </CopilotStep>
                      ) : (
                        <DocumentCard document={item} />
                      )
                    }
                    keyExtractor={(item) =>
                      item.id?.toString?.() || String(item.id)
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingBottom: 120,
                      paddingTop: 10,
                      minHeight: screenHeight,
                      gap: 10,
                    }}
                    refreshing={isRefetching && !isFetchingNextPage}
                    onRefresh={handlePullToRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.6}
                    ListFooterComponent={
                      isFetchingNextPage ? (
                        <View style={{ gap: 10, paddingTop: 10 }}>
                          <DocumentCardSkeleton />
                          <DocumentCardSkeleton />
                        </View>
                      ) : null
                    }
                    ListEmptyComponent={
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          top: screenHeight * 0.2,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="folder"
                          size={72}
                          color={theme.grayBorder}
                          style={{ marginBottom: 16 }}
                        />
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: theme.primary,
                            marginBottom: 8,
                          }}
                        >
                          No Documets Yet
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            color: theme.secondaryText,
                            textAlign: "center",
                            maxWidth: 260,
                          }}
                        >
                          You have no{" "}
                          <Text
                            style={{
                              textTransform: "lowercase",
                            }}
                          >
                            {status}
                          </Text>{" "}
                          documents for this category at the moment.
                        </Text>
                      </View>
                    }
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

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.safeAreaBg,
      paddingHorizontal: 8,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.white,
    },
    underline: {
      height: 3,
      width: 56,
      borderRadius: Radii.full,
      backgroundColor: theme.activeText,
      opacity: 0.85,
      marginTop: 6,
    },
    tabsRow: {
      flexDirection: "row",
      gap: 8,
      paddingBottom: 2,
      paddingTop: 10,
    },
    tabButton: {
      paddingVertical: 6,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    tabTextActive: {
      color: theme.primary,
    },
    tabUnderline: {
      height: 2,
      width: "100%",
      borderRadius: Radii.full,
      backgroundColor: "transparent",
      marginTop: 6,
    },
    tabUnderlineActive: {
      backgroundColor: theme.primary,
    },
  });
