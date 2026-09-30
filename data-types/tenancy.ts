export interface TenantSummary {
  tenantId: string;
  name: string | null;
  logoUrl: string | null;
}

export interface TenantResolveByEmailResponse {
  tenants: TenantSummary[];
}

export interface PersistedTenant extends TenantSummary {
  email: string;
  resolvedAt: number;
}
