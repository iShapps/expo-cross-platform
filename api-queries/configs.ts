import { postResource } from "@/api-actions/mutations";
import { IConfigResponse } from "@/data-types/config";

let commonContentRequest: Promise<IConfigResponse> | null = null;

export async function getGeneralAppConfigs(): Promise<IConfigResponse> {
  if (commonContentRequest) {
    return commonContentRequest;
  }

  commonContentRequest = postResource<{}, IConfigResponse>(
    "/get-common-content",
    {},
  ).finally(() => {
    commonContentRequest = null;
  });

  return commonContentRequest;
}
