import { postResource } from "@/api-actions/mutations";
import { IConfigResponse } from "@/data-types/config";
import {
  markBootstrapFinished,
  markBootstrapStarted,
} from "@/utils/runtime-diagnostics";

let commonContentRequest: Promise<IConfigResponse> | null = null;

export async function getGeneralAppConfigs(): Promise<IConfigResponse> {
  if (commonContentRequest) {
    return commonContentRequest;
  }

  markBootstrapStarted();
  commonContentRequest = postResource<{}, IConfigResponse>(
    "/get-common-content",
    {},
  ).finally(() => {
    commonContentRequest = null;
    markBootstrapFinished();
  });

  return commonContentRequest;
}
