import { postResource } from "@/api-actions/mutations";
import { IConfigResponse } from "@/data-types/config";

export async function getGeneralAppConfigs(): Promise<IConfigResponse> {
  return postResource<{}, IConfigResponse>("/get-common-content", {});
}
