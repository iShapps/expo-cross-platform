import { AGREEMENTS_QUERY_KEY, getAgreements } from "@/api-queries/agreements";
import { useProfileData } from "@/data-store/use-account-store";
import { useQuery } from "@tanstack/react-query";

/**
 * The worker's agreements (to sign, and signed). The Agreements screen, the
 * Home banner and the More tab share this one query.
 */
export function useAgreements() {
  const hcpId = useProfileData((state) => state.userDetails?.hcp?.id);

  const query = useQuery({
    queryKey: AGREEMENTS_QUERY_KEY,
    queryFn: getAgreements,
    enabled: !!hcpId,
    staleTime: 5 * 60 * 1000,
    gcTime: 1000 * 60 * 60,
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
    // Without the HR module the endpoint answers with an error: show nothing.
    retry: false,
  });

  return {
    ...query,
    toSign: query.data?.to_sign ?? [],
    signed: query.data?.signed ?? [],
    consented: query.data?.consented ?? false,
    toSignCount: query.data?.to_sign?.length ?? 0,
  };
}
