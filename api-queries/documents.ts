import { postResource } from "@/api-actions/mutations";
import { IDocumentsResponse } from "@/data-types/documents";

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
