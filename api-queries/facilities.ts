import { postResource } from "@/api-actions/mutations";
import { IFacilityResponse } from "@/data-types/facilities";

export async function getFacilities(): Promise<IFacilityResponse> {
  return postResource<{}, IFacilityResponse>("/facility", {});
}
