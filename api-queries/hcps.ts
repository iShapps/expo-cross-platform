import { postResource } from "@/api-actions/mutations";
import { IHCPsResponse } from "@/data-types/hcps";

export async function getAllHcps(
  page = 1,
  name?: string,
): Promise<IHCPsResponse> {
  return postResource<{ page: number }, IHCPsResponse>("/hcps", {
    page,
    ...(name ? { name } : {}),
  });
}
