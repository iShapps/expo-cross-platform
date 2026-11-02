import type { AgreementSummary } from "@/api-queries/agreements";
import { getGenaralStatementDocuments, getProfessionDocuments, type MissingDocument } from "@/api-queries/documents";
import AgreementCard from "@/components/agreement-card";
import { AppText, EmptyState, SegmentedTabs } from "@/components/design";
import DocumentCard from "@/components/document-card";
import MissingDocumentCard from "@/components/missing-document-card";
import TabsHeader from "@/components/shared/tabs-header";
import { DocumentCardSkeleton } from "@/components/skeletons";
import { Space } from "@/constants/design";
import { IDocument } from "@/data-types/documents";
import { useAgreements } from "@/hooks/use-agreements";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useMissingDocuments } from "@/hooks/use-missing-documents";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";

const WalkthroughableView = walkthroughable(View);

/** Same names as the web: Documents → Certifications | Contracts | Policies. */
type Segment = "certifications" | "contracts" | "policies";

/** Uploaded documents of one kind. The API returns them all on one page (200 a page). */
const useUploadedDocuments = (key: string, fetchPage: () => Promise<any>) =>
  useQuery({
    queryKey: [key],
    queryFn: fetchPage,
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30 * 60 * 1000,
    select: (res): IDocument[] => res?.data?.hcps?.data ?? [],
  });

/** A row of the Certifications list: a small heading, or a document. */
type CertificationRow =
  | { kind: "heading"; key: string; title: string }
  | { kind: "action"; key: string; doc: MissingDocument }
  | { kind: "uploaded"; key: string; doc: IDocument };

export default function DocumentsScreen() {
  const { colors } = useAppTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isFocused = useIsFocused();
  const router = useRouter();

  const missing = useMissingDocuments();
  const general = useUploadedDocuments("general-documents", () => getGenaralStatementDocuments());
  const profession = useUploadedDocuments("profession-documents", () => getProfessionDocuments());
  const agreements = useAgreements();

  // Contracts and Policies are the HR module's: without it the agreements call fails, so they're not shown.
  const hasAgreements = !agreements.isError || !!agreements.data;
  const segments: Segment[] = hasAgreements ? ["certifications", "contracts", "policies"] : ["certifications"];
  const [active, setActive] = useState<Segment>("certifications");

  const contracts = useMemo(() => split(agreements.toSign, agreements.signed, "contract"), [agreements.toSign, agreements.signed]);
  const policies = useMemo(() => split(agreements.toSign, agreements.signed, "policy"), [agreements.toSign, agreements.signed]);

  const labels = segments.map((s) => {
    const count = s === "certifications" ? missing.actionCount : s === "contracts" ? contracts.toSign.length : policies.toSign.length;
    const name = s === "certifications" ? "Certifications" : s === "contracts" ? "Contracts" : "Policies";
    return count > 0 ? `${name} (${count})` : name;
  });

  // Needs action first (missing, rejected, expired, expiring), then everything uploaded and in order.
  const certificationRows = useMemo<CertificationRow[]>(() => {
    const actionIds = new Set(missing.documents.map((d) => d.document_id));
    const uploaded = [...(general.data ?? []), ...(profession.data ?? [])].filter((d) => !actionIds.has(d.document_id));
    const rows: CertificationRow[] = [];
    if (missing.documents.length) {
      rows.push({ kind: "heading", key: "h-action", title: "Needs action" });
      missing.documents.forEach((doc) => rows.push({ kind: "action", key: `a-${doc.document_id}`, doc }));
    }
    if (uploaded.length) {
      rows.push({ kind: "heading", key: "h-ok", title: "Up to date" });
      uploaded.forEach((doc) => rows.push({ kind: "uploaded", key: `u-${doc.id}`, doc }));
    }
    return rows;
  }, [missing.documents, general.data, profession.data]);

  const certificationsLoading = missing.isLoading || general.isLoading || profession.isLoading;
  const certificationsRefreshing = missing.isRefetching || general.isRefetching || profession.isRefetching;
  const refreshCertifications = () => {
    void missing.refetch();
    void general.refetch();
    void profession.refetch();
  };

  // ── Paging between segments ────────────────────────────────────────────
  const pagerRef = useRef<ScrollView>(null);
  const goTo = useCallback(
    (segment: Segment) => {
      const index = Math.max(segments.indexOf(segment), 0);
      setActive(segments[index]);
      pagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screenWidth, segments.length],
  );

  // Links open a segment with ?tab=: certifications ("missing" from older links),
  // contracts, policies, or agreements (whichever has something to sign).
  // Cleared once handled: tab screens stay mounted, so a repeat link must register as a change.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  useEffect(() => {
    if (!tab) return;
    const wanted = tab.toLowerCase();
    const segment: Segment =
      wanted === "contracts" || wanted === "policies"
        ? (wanted as Segment)
        : wanted === "agreements"
          ? contracts.toSign.length || !policies.toSign.length ? "contracts" : "policies"
          : "certifications";
    // After layout, so the pager can scroll.
    requestAnimationFrame(() => goTo(segment));
    router.setParams({ tab: undefined });
  }, [tab, goTo, router, contracts.toSign.length, policies.toSign.length]);

  useFirstVisitTour("documents", isFocused && !certificationsLoading);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabsHeader title="Documents" />
      <View style={styles.tabsWrap}>
        <CopilotStep
          name="documents-tabs"
          order={1}
          active={isFocused}
          text="Certifications are your documents: what needs uploading comes first. Contracts and Policies are what your agency sends you to read and sign."
        >
          <WalkthroughableView>
            <SegmentedTabs
              tabs={labels}
              activeIndex={segments.indexOf(active)}
              onTabPress={(index) => goTo(segments[index])}
            />
          </WalkthroughableView>
        </CopilotStep>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setActive(segments[Math.min(Math.max(index, 0), segments.length - 1)]);
        }}
      >
        {/* Certifications */}
        <View style={{ width: screenWidth }}>
          {certificationsLoading ? (
            <View style={[listContent(screenHeight), styles.page]}>
              {Array.from({ length: 5 }).map((_, i) => <DocumentCardSkeleton key={i} />)}
            </View>
          ) : (
            <FlatList
              data={certificationRows}
              keyExtractor={(row) => row.key}
              renderItem={({ item, index }) =>
                item.kind === "heading" ? (
                  <AppText variant="subhead" color="textSecondary" style={index > 0 ? styles.headingSpaced : undefined}>
                    {item.title}
                  </AppText>
                ) : item.kind === "action" ? (
                  <MissingDocumentCard document={item.doc} />
                ) : index === certificationRows.findIndex((r) => r.kind === "uploaded") ? (
                  <CopilotStep
                    name="documents-first-card"
                    order={2}
                    active={isFocused}
                    text="The blue pill says whether it's a general certification or for one of your professions. Tap a certification to preview it or upload a new copy."
                  >
                    <WalkthroughableView>
                      <DocumentCard document={item.doc} />
                    </WalkthroughableView>
                  </CopilotStep>
                ) : (
                  <DocumentCard document={item.doc} />
                )
              }
              contentContainerStyle={[listContent(screenHeight), styles.page]}
              showsVerticalScrollIndicator={false}
              refreshing={certificationsRefreshing}
              onRefresh={refreshCertifications}
              ListEmptyComponent={
                missing.isError && general.isError ? (
                  <EmptyState
                    icon="cloud-offline-outline"
                    tone="danger"
                    title="Couldn't load your certifications"
                    message="Pull to refresh or try again later."
                    actionLabel="Retry"
                    onAction={refreshCertifications}
                    style={{ marginTop: screenHeight * 0.1 }}
                  />
                ) : (
                  <EmptyState
                    icon="folder-open-outline"
                    title="No certifications yet"
                    message="When your agency needs a certification from you, it shows up here."
                    style={{ marginTop: screenHeight * 0.1 }}
                  />
                )
              }
            />
          )}
        </View>

        {hasAgreements && (
          <AgreementsPage
            width={screenWidth}
            screenHeight={screenHeight}
            groups={contracts}
            loading={agreements.isLoading}
            refreshing={agreements.isRefetching}
            onRefresh={() => void agreements.refetch()}
            empty={{ title: "No contracts yet", message: "When your agency sends you a contract to sign, it appears here." }}
          />
        )}
        {hasAgreements && (
          <AgreementsPage
            width={screenWidth}
            screenHeight={screenHeight}
            groups={policies}
            loading={agreements.isLoading}
            refreshing={agreements.isRefetching}
            onRefresh={() => void agreements.refetch()}
            empty={{ title: "No policies yet", message: "When your agency sends you a policy to read and sign, it appears here." }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** One kind of agreement, to sign first. */
function split(toSign: AgreementSummary[], signed: AgreementSummary[], kind: AgreementSummary["kind"]) {
  return { toSign: toSign.filter((a) => a.kind === kind), signed: signed.filter((a) => a.kind === kind) };
}

type AgreementRow = { kind: "heading"; key: string; title: string } | { kind: "item"; key: string; item: AgreementSummary };

function AgreementsPage({
  width, screenHeight, groups, loading, refreshing, onRefresh, empty,
}: {
  width: number;
  screenHeight: number;
  groups: { toSign: AgreementSummary[]; signed: AgreementSummary[] };
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  empty: { title: string; message: string };
}) {
  const rows = useMemo<AgreementRow[]>(() => {
    const out: AgreementRow[] = [];
    if (groups.toSign.length) {
      out.push({ kind: "heading", key: "h-sign", title: "To sign" });
      groups.toSign.forEach((item) => out.push({ kind: "item", key: `s-${item.id}`, item }));
    }
    if (groups.signed.length) {
      out.push({ kind: "heading", key: "h-signed", title: "Signed" });
      groups.signed.forEach((item) => out.push({ kind: "item", key: `d-${item.id}`, item }));
    }
    return out;
  }, [groups]);

  return (
    <View style={{ width }}>
      {loading ? (
        <View style={[listContent(screenHeight), styles.page]}>
          {Array.from({ length: 3 }).map((_, i) => <DocumentCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={({ item, index }) =>
            item.kind === "heading" ? (
              <AppText variant="subhead" color="textSecondary" style={index > 0 ? styles.headingSpaced : undefined}>
                {item.title}
              </AppText>
            ) : (
              <AgreementCard item={item.item} />
            )
          }
          contentContainerStyle={[listContent(screenHeight), styles.page]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <EmptyState icon="document-text-outline" title={empty.title} message={empty.message} style={{ marginTop: screenHeight * 0.1 }} />
          }
        />
      )}
    </View>
  );
}

const listContent = (screenHeight: number) => ({
  paddingBottom: 120,
  paddingTop: Space.md,
  minHeight: screenHeight,
  gap: Space.sm,
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  tabsWrap: { paddingHorizontal: Space.gutter },
  page: { paddingHorizontal: Space.gutter },
  headingSpaced: { marginTop: Space.md },
});
