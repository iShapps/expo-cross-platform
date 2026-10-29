import { getMissingDocuments } from "@/api-queries/documents";
import { useProfileData } from "@/data-store/use-account-store";
import { useQuery } from "@tanstack/react-query";

export const MISSING_DOCUMENTS_QUERY_KEY = ["missing-documents"] as const;

/**
 * The required documents the HCP has to act on (missing, rejected, expired,
 * expiring soon) — Documents tab's Missing section, the tab badge and the
 * Home banner share this one query.
 */
export function useMissingDocuments() {
  const hcpId = useProfileData((state) => state.userDetails?.hcp?.id);

  const query = useQuery({
    queryKey: MISSING_DOCUMENTS_QUERY_KEY,
    queryFn: getMissingDocuments,
    enabled: !!hcpId,
    staleTime: 5 * 60 * 1000,
    gcTime: 1000 * 60 * 60,
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });

  const documents = query.data?.data?.documents ?? [];
  const counts = query.data?.data?.counts;
  // Needs doing now; "expiring" is a heads-up, not counted in the badge.
  const actionCount =
    (counts?.missing ?? 0) + (counts?.rejected ?? 0) + (counts?.expired ?? 0);

  return { ...query, documents, actionCount, expiringCount: counts?.expiring ?? 0 };
}
