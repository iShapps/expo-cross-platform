import { apiRequest, ApiRequestError } from "@/api-actions/api-client";
import {
  extractApiErrorMessage,
  isUnauthorizedStatus,
  notifyAuthExpired,
} from "@/api-actions/error-utils";
import { postResource } from "@/api-actions/mutations";
import { IDocumentsResponse } from "@/data-types/documents";
import { TokenStorage } from "@/utils/auth-api";
import {
  createUploadTask,
  FileSystemSessionType,
  FileSystemUploadType,
} from "expo-file-system/legacy";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TIMEOUT = 30000;

const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL!.replace(/\/$/, "")}${endpoint}`;

export class DocumentsQueryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "DocumentsQueryError";
  }
}

export async function getGenaralStatementDocuments(
  page = 1,
): Promise<IDocumentsResponse> {
  return postResource<{ type: string; page: number }, IDocumentsResponse>(
    "/hcp/documents",
    {
      type: "general-statement",
      page,
    },
  );
}

export async function getDutyStatementDocuments(
  page = 1,
): Promise<IDocumentsResponse> {
  return postResource<{ type: string; page: number }, IDocumentsResponse>(
    "/hcp/documents",
    {
      type: "duty-statement",
      page,
    },
  );
}

export async function getProfessionDocuments(
  page = 1,
): Promise<IDocumentsResponse> {
  return postResource<{ type: string; page: number }, IDocumentsResponse>(
    "/hcp/documents",
    {
      type: "profession",
      page,
    },
  );
}

export type DocumentFileUrlResponse = {
  status: true;
  data: {
    url: string;
    filename: string;
    type: string;
  };
};

// hcpId/documentHcpId are the `hcp_id` / `id` fields of the IDocument record.
export async function getDocumentFileUrl(
  hcpId: number,
  documentHcpId: number,
): Promise<DocumentFileUrlResponse> {
  const endpoint = `/v2/hcps/${hcpId}/documents/${documentHcpId}/url`;
  const token = await TokenStorage.getToken();
  const headers: Record<string, unknown> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const { data } = await apiRequest<DocumentFileUrlResponse>({
      url: getApiUrl(endpoint),
      endpoint,
      method: "GET",
      headers,
      timeoutMs: API_TIMEOUT,
      retryOnAndroidNetworkError: true,
    });

    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const message = extractApiErrorMessage(
        error.details.data,
        "Could not load the document preview.",
      );

      if (
        error.kind === "server" &&
        isUnauthorizedStatus(error.details.statusCode)
      ) {
        await notifyAuthExpired({
          message,
          statusCode: error.details.statusCode ?? 0,
        });
      }

      throw new DocumentsQueryError(
        message,
        error.details.statusCode,
        error.details.data,
      );
    }

    throw new DocumentsQueryError(
      error instanceof Error
        ? error.message
        : "Could not load the document preview.",
    );
  }
}

export type UpdateDocumentPayload = {
  document_id: number;
  file: { uri: string; name: string; mimeType?: string };
  expiry_date?: string;
};

export type UpdateDocumentResponse = {
  status: true;
  message: string;
  data: unknown;
};

export type DocumentUploadProgress = {
  bytesSent: number;
  bytesExpected: number;
  percent: number | null;
};

export type BackgroundDocumentUpload = {
  // Resolves once the upload finishes and the server has responded.
  completion: Promise<UpdateDocumentResponse>;
  // Cancels the underlying native upload session.
  cancel: () => Promise<void>;
};

// Replaces the file for a document the HCP already has on record, via a native
// (OS-level) background upload session rather than a JS `fetch`. This keeps
// the request off the JS thread — the UI stays responsive, the upload survives
// the app being backgrounded, and large files stream instead of sitting fully
// in memory as a JS FormData blob. Re-uses the registration upload endpoint,
// which upserts by document_id for the signed-in HCP and resets approval back
// to "pending" for admin re-review.
export async function startBackgroundDocumentUpload(
  payload: UpdateDocumentPayload,
  onProgress?: (progress: DocumentUploadProgress) => void,
): Promise<BackgroundDocumentUpload> {
  const endpoint = "/v2/registration/documents";
  const token = await TokenStorage.getToken();

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const parameters: Record<string, string> = {
    document_id: String(payload.document_id),
  };
  if (payload.expiry_date) parameters.expiry_date = payload.expiry_date;

  const task = createUploadTask(
    getApiUrl(endpoint),
    payload.file.uri,
    {
      httpMethod: "POST",
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: "file",
      mimeType: payload.file.mimeType ?? "application/octet-stream",
      parameters,
      headers,
      // Keeps the upload running natively even if the app is backgrounded (iOS).
      sessionType: FileSystemSessionType.BACKGROUND,
    },
    (data) => {
      const { totalBytesSent, totalBytesExpectedToSend } = data;
      onProgress?.({
        bytesSent: totalBytesSent,
        bytesExpected: totalBytesExpectedToSend,
        percent:
          totalBytesExpectedToSend > 0
            ? Math.round((totalBytesSent / totalBytesExpectedToSend) * 100)
            : null,
      });
    },
  );

  const completion = (async (): Promise<UpdateDocumentResponse> => {
    let result;
    try {
      result = await task.uploadAsync();
    } catch (err) {
      throw new DocumentsQueryError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    }

    if (!result) {
      throw new DocumentsQueryError("Upload was cancelled.");
    }

    let json: unknown;
    try {
      json = JSON.parse(result.body);
    } catch {
      throw new DocumentsQueryError("Invalid response from server.");
    }

    if (result.status < 200 || result.status >= 300) {
      const message = extractApiErrorMessage(json, "Could not update document.");
      if (isUnauthorizedStatus(result.status)) {
        await notifyAuthExpired({ message, statusCode: result.status });
      }
      throw new DocumentsQueryError(message, result.status, json);
    }

    return json as UpdateDocumentResponse;
  })();

  return { completion, cancel: () => task.cancelAsync() };
}
