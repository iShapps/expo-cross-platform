import { postResource } from "@/api-actions/mutations";
import { DashboardResponse } from "@/data-types/dashboard";

export async function getHCPDashboard(): Promise<DashboardResponse> {
  return postResource<{}, DashboardResponse>("/hcp/dashboard", {});
}
