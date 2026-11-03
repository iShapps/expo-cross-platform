import * as SecureStore from "expo-secure-store";

// Lets switching organizations restore a previously completed login
// instantly instead of re-authenticating — each tenant has its own
// password and its own self-onboarding, so there is no shared credential
// to silently reuse across tenants (see app/ctx.tsx's switchTenant).
type ArchivedTenantSession = {
  accessToken: string;
  userJson: string;
  savedAt: number;
};

const keyFor = (tenantId: string) => `ishapps_tenant_session_${tenantId}`;

export async function saveTenantSession(
  tenantId: string,
  session: { accessToken: string; userJson: string },
) {
  const payload: ArchivedTenantSession = { ...session, savedAt: Date.now() };
  await SecureStore.setItemAsync(keyFor(tenantId), JSON.stringify(payload));
}

export async function getTenantSession(
  tenantId: string,
): Promise<ArchivedTenantSession | null> {
  const raw = await SecureStore.getItemAsync(keyFor(tenantId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ArchivedTenantSession;
  } catch {
    return null;
  }
}

export async function clearTenantSession(tenantId: string) {
  await SecureStore.deleteItemAsync(keyFor(tenantId));
}
