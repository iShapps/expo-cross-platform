import { postResource } from "@/api-actions/mutations";
import { IProfileResponse } from "@/data-types/profile";

export async function postProfile(): Promise<IProfileResponse> {
  return postResource<{}, IProfileResponse>("/hcp/profile", {});
}
