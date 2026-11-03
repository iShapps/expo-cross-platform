import * as SecureStore from "expo-secure-store";

// Scoped per tenant — each organization has its own password for the same
// HCP, so credentials saved for one tenant must never be reused to log
// into another (see app/ctx.tsx's switchTenant). Same-tenant reuse (OneSignal
// device-registration retry, biometric unlock) stays valid.
const emailKeyFor = (tenantId: string) => `ishapps_email_${tenantId}`;
const passwordKeyFor = (tenantId: string) => `ishapps_password_${tenantId}`;

export async function saveLoginCredentials(
  tenantId: string,
  email: string,
  password: string,
) {
  await SecureStore.setItemAsync(emailKeyFor(tenantId), email);
  await SecureStore.setItemAsync(passwordKeyFor(tenantId), password);
}

export async function getLoginCredentials(tenantId: string) {
  const email = await SecureStore.getItemAsync(emailKeyFor(tenantId));
  const password = await SecureStore.getItemAsync(passwordKeyFor(tenantId));

  return { email, password };
}

export async function clearLoginCredentials(tenantId: string) {
  await SecureStore.deleteItemAsync(emailKeyFor(tenantId));
  await SecureStore.deleteItemAsync(passwordKeyFor(tenantId));
}
