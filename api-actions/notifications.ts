import { postResource } from "@/api-actions/mutations";

interface TestNotificationResponse {
  status: boolean;
  message: string;
}

export async function sendTestNotification(
  hcpId: number,
): Promise<TestNotificationResponse> {
  return postResource<Record<string, never>, TestNotificationResponse>(
    `/hcps/${hcpId}/test-notification`,
    {},
  );
}
