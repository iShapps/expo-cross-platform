import { postResource } from "@/api-actions/mutations";
import { IShiftDetailResponse } from "@/data-types/shifts";

export async function postShiftDetails(
  id: string,
): Promise<IShiftDetailResponse> {
  return postResource<{ shift_id: string }, IShiftDetailResponse>(
    "/shift/details",
    {
      shift_id: id,
    },
  );
}
