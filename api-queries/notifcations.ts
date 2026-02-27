import { postResource } from "@/api-actions/mutations";
import { INotificationResponse } from "@/data-types/notifications";

export async function getNotifications(
  page = 1,
): Promise<INotificationResponse> {
  return postResource<{ page: number }, INotificationResponse>(
    "/hcp/notifications",
    {
      page,
    },
  );
}
