import {
  getDutyStatementDocuments,
  getGenaralStatementDocuments,
  getProfessionDocuments,
} from "@/api-queries/documents";
import { EmptyState, SegmentedTabs } from "@/components/design";
import DocumentCard from "@/components/document-card";
import TabsHeader from "@/components/shared/tabs-header";
import { DocumentCardSkeleton } from "@/components/skeletons";
import { Space } from "@/constants/design";
import { IDocument } from "@/data-types/documents";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
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


  const isFocused = useIsFocused();

  useFirstVisitTour("documents", isFocused && !generalQuery.isLoading);

  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabsHeader title="My documents" />
      <View style={styles.container}>
        <CopilotStep
          name="documents-tabs"
          order={1}
          active={isFocused}
          text="Documents are grouped into General, Professional, and Others — switch tabs to see what's required in each category."
        >
          <WalkthroughableView style={styles.tabsWrap}>
            <SegmentedTabs
              tabs={documentTabs}
              activeIndex={documentTabs.indexOf(activeStatus)}
              onTabPress={handleTabPress}
              onTabLayout={(index, layout) => {
                tabOffsetsRef.current[index] = layout.x;
                tabWidthsRef.current[index] = layout.width;
              }}
            />
          </WalkthroughableView>
        </CopilotStep>

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
            // Page width must stay screenWidth - 16 (as before); the inner
            // padding brings the cards to the 20pt page gutter.
            <View
              key={status}
              style={{ width: screenWidth - 16, paddingHorizontal: 12 }}
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
                      contentContainerStyle={listContent(screenHeight)}
                      refreshing={isRefetching && !isFetchingNextPage}
                      onRefresh={handlePullToRefresh}
                    />
                  );
                }

                if (isError) {
                  return (
                    <EmptyState
                      icon="cloud-offline-outline"
                      tone="danger"
                      title="Couldn't load documents"
                      message={
                        `Something went wrong while fetching ${status.toLowerCase()} documents. Pull to refresh or try again later.` +
                        (shiftError instanceof Error ? `\n(${shiftError.message})` : "")
                      }
                      actionLabel="Retry"
                      onAction={handlePullToRefresh}
                      style={{ marginTop: screenHeight * 0.1 }}
                    />
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
                    contentContainerStyle={listContent(screenHeight)}
                    refreshing={isRefetching && !isFetchingNextPage}
                    onRefresh={handlePullToRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.6}
                    ListFooterComponent={
                      isFetchingNextPage ? (
                        <View style={styles.footer}>
                          <DocumentCardSkeleton />
                          <DocumentCardSkeleton />
                        </View>
                      ) : null
                    }
                    ListEmptyComponent={
                      <EmptyState
                        icon="folder-open-outline"
                        title="No documents yet"
                        message={`You have no ${status.toLowerCase()} documents for this category at the moment.`}
                        style={{ marginTop: screenHeight * 0.1 }}
                      />
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

const listContent = (screenHeight: number) => ({
  paddingBottom: 120,
  paddingTop: Space.md,
  minHeight: screenHeight,
  gap: Space.sm,
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    // Keep at 8: the pages above are screenWidth - 2 × this wide.
    paddingHorizontal: 8,
  },
  tabsWrap: {
    paddingHorizontal: 12,
  },
  footer: {
    gap: Space.sm,
    paddingTop: Space.sm,
  },
});
