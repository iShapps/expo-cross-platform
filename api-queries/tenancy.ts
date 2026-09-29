import { apiRequest, ApiRequestError } from "@/api-actions/api-client";
import { extractApiErrorMessage } from "@/api-actions/error-utils";
import {
  TenantResolveByEmailResponse,
  TenantSummary,
} from "@/data-types/tenancy";
import { debug, error as logError } from "@/utils/logger";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TIMEOUT = 15000;

const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL!.replace(/\/$/, "")}${endpoint}`;

export class TenancyQueryError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "TenancyQueryError";
  }
}

export async function resolveTenantsByEmail(
  email: string | undefined | null,
): Promise<TenantSummary[]> {
  if (!email || !email.trim()) {
    throw new TenancyQueryError("Missing email to look up an organization.");
  }

  const endpoint = "/tenancy/resolve";
  const url = getApiUrl(endpoint);
  const body = { email: email.trim() };

  debug("[Tenancy] Resolving tenants by email", { API_BASE_URL, url, body });

  try {
    const { data } = await apiRequest<TenantResolveByEmailResponse>({
      url,
      endpoint,
      method: "POST",
      body,
      timeoutMs: API_TIMEOUT,
    });

    debug("[Tenancy] Resolve succeeded", data);
    return data.tenants ?? [];
  } catch (err) {
    if (err instanceof ApiRequestError) {
      logError("[Tenancy] Resolve failed", {
        url,
        statusCode: err.details.statusCode,
        kind: err.kind,
        data: err.details.data,
      });

      if (err.kind === "server") {
        const message = extractApiErrorMessage(
          err.details.data,
          "Could not look up your organization. Please try again.",
        );
        throw new TenancyQueryError(message, err.details.statusCode);
      }

      throw new TenancyQueryError(err.details.userMessage);
    }

    logError("[Tenancy] Resolve failed (non-ApiRequestError)", { url, err });

    throw new TenancyQueryError(
      err instanceof Error
        ? err.message
        : "Could not look up your organization. Please try again.",
    );
  }
}
