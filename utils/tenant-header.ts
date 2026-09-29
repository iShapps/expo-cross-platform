import { useTenantStore } from "@/data-store/use-tenant-store";

export function getTenantHeaders(): Record<string, string> {
  const tenantId = useTenantStore.getState().tenant?.tenantId;
  return tenantId ? { "X-Tenant-Code": tenantId } : {};
}
