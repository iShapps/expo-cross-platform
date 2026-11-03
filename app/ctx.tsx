import {
  logApiErrorToSentry,
  registerAuthExpiredHandler,
  setAuthExpiredSuppressed,
} from "@/api-actions/error-utils";
import { useProfileData } from "@/data-store/use-account-store";
import { useTenantStore } from "@/data-store/use-tenant-store";
import LoginCredentials, { Hcp, User } from "@/data-types/auth";
import { TenantSummary } from "@/data-types/tenancy";
import {
  ensureOneSignalSubscriptionId,
  onLoginSuccess,
  onLogout,
} from "@/hooks/use-one-signal";
import { stopBackgroundTracking } from "@/task-services/locationTask";
import { removeToken, setToken as setAuthToken } from "@/utils/auth";
import {
  login as apiLogin,
  logout as apiLogout,
  AuthenticationError,
  computeOnboardingStep,
  getRegistrationStatus,
  NetworkError,
  TokenStorage,
} from "@/utils/auth-api";
import { debug, error } from "@/utils/logger";
import {
  incrementProviderMount,
  incrementProviderUnmount,
} from "@/utils/runtime-diagnostics";
import {
  getLoginCredentials,
  saveLoginCredentials,
} from "@/utils/secure-login-credentials";
import {
  clearTenantSession,
  getTenantSession,
  saveTenantSession,
} from "@/utils/tenant-session-archive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { useStorageState } from "./useStorageState";

// SecureStore (iOS Keychain) survives app uninstall/reinstall by design —
// AsyncStorage does not. We use that difference to detect a genuine fresh
// install and wipe any session left over in the Keychain from a previous
// install, so reinstalling always starts from a clean, logged-out state.
const FRESH_INSTALL_MARKER_KEY = "ishapps-has-launched";

// "switched": restored an already-cached session for that tenant, instant,
// no login needed. "needs-login": no cached session for that tenant on this
// device — the tenant is now active and the existing Stack.Protected guards
// in app/_layout.tsx will route to /(open)/login for it. "failed": a
// transient error (e.g. network) during the switch — nothing was changed.
export type TenantSwitchResult = "switched" | "needs-login" | "failed";

const AuthContext = React.createContext<{
  signIn: (
    data: LoginCredentials,
  ) => Promise<"authenticated" | "onboarding" | "password-reset-required">;
  retryNotificationSetup: () => Promise<boolean>;
  setSess: (data: string) => void;
  signOut: () => Promise<void>;
  updateHcp: (patch: Partial<Hcp>) => void;
  switchTenant: (
    tenant: TenantSummary,
    email?: string,
  ) => Promise<TenantSwitchResult>;
  session?: string | null;
  user?: User | null;
  isLoading: boolean;
}>({
  signIn: () => Promise.resolve("authenticated"),
  retryNotificationSetup: () => Promise.resolve(false),
  setSess: () => null,
  signOut: () => Promise.resolve(),
  updateHcp: () => null,
  switchTenant: () => Promise.resolve("failed"),
  session: null,
  user: null,
  isLoading: false,
});

type TenantSwitchHandler = (
  tenant: TenantSummary,
) => Promise<TenantSwitchResult>;
let tenantSwitchHandler: TenantSwitchHandler | null = null;

export function registerTenantSwitchHandler(handler: TenantSwitchHandler) {
  tenantSwitchHandler = handler;

  return () => {
    if (tenantSwitchHandler === handler) {
      tenantSwitchHandler = null;
    }
  };
}

/**
 * Lets code outside the component tree (the OneSignal notification-click
 * listener) trigger the same tenant switch that switch-organization.tsx
 * uses via useSession().switchTenant — restoring a cached session for that
 * tenant if this device has one, or pointing the app at that tenant's own
 * login screen if it doesn't. Each tenant has its own password, so there is
 * never a silent cross-tenant login attempt.
 */
export async function requestTenantSwitch(
  tenant: TenantSummary,
): Promise<TenantSwitchResult> {
  return (await tenantSwitchHandler?.(tenant)) ?? "failed";
}

// hook to access the user info.
export function useSession() {
  const value = React.useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export const getOnboardingRouteParams = (user?: User | null) => {
  const hcp = user?.hcp;
  if (!hcp?.id) {
    return null;
  }

  // "0" means registration is fully complete — skip onboarding. Anything
  // else, including null/unset (never started), still needs onboarding —
  // default to step 1 rather than treating "never started" as "complete".
  const registrationScreen = hcp.app_registration_screen;
  if (registrationScreen === "0") {
    return null;
  }

  return {
    hcpId: String(hcp.id),
    screen: registrationScreen || "1",
  };
};

export const needsForcedPasswordReset = (user?: User | null) =>
  user?.require_password_reset === 1;

export function useProtectedRoute(
  session: string | null | undefined,
  user: User | null,
  authLoading: boolean,
  isHydrating: boolean,
) {
  const segments = useSegments();
  const router = useRouter();
  debug("session", session);

  const hasTenant = useTenantStore((state) => !!state.tenant);
  const tenantHasHydrated = useTenantStore((state) => state.hasHydrated);

  const pathname = usePathname();
  const currentRoute = pathname === "/(open)/index";
  useEffect(() => {
    if (authLoading || isHydrating) return;
    if (!tenantHasHydrated || !hasTenant) return;

    const inAuthGroup = segments[0] === "(open)";
    const inOnboarding = segments[0] === "onboarding";
    const inSupportChat = segments[0] === "support-chat";
    const inForcedPasswordReset = segments[0] === "force-password-reset";
    const requiresPasswordReset = needsForcedPasswordReset(user);
    const onboardingParams = getOnboardingRouteParams(user);

    if (!session && !inAuthGroup && (currentRoute || inForcedPasswordReset)) {
      // Redirect to the sign-in page.
      router.replace("/(open)/login");
    } else if (session && requiresPasswordReset && !inForcedPasswordReset) {
      // Takes priority over onboarding
      router.replace("/force-password-reset");
    } else if (
      session &&
      !requiresPasswordReset &&
      onboardingParams &&
      !inOnboarding &&
      !inSupportChat
    ) {
      router.replace({
        pathname: "/onboarding",
        params: onboardingParams,
      });
    } else if (
      session &&
      !requiresPasswordReset &&
      !onboardingParams &&
      ((inAuthGroup && !inOnboarding) || currentRoute || inOnboarding)
    ) {
      // Redirect to the home page. Includes the case where onboardingParams
      // just became null while already sitting on /onboarding (registration
      // completed)
      router.replace("/(tabs)");
    }
  }, [
    authLoading,
    currentRoute,
    isHydrating,
    router,
    segments,
    session,
    user,
    hasTenant,
    tenantHasHydrated,
  ]);
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [[isHydrating, session], setSession] =
    useStorageState("authToken-ishapps");
  const [[isHydratingUser, userJson], setUserJson] =
    useStorageState("user_data");

  const [authLoading, setAuthLoading] = React.useState(false);
  const router = useRouter();

  const profileStore = useProfileData();
  const queryClient = useQueryClient();

  const user = userJson ? (JSON.parse(userJson) as User) : null;

  useProtectedRoute(session, user, authLoading, isHydrating || isHydratingUser);

  useEffect(() => {
    incrementProviderMount("SessionProvider");

    return () => {
      incrementProviderUnmount("SessionProvider");
    };
  }, []);

  // iOS Keychain (what SecureStore uses) survives app uninstall/reinstall by
  // design — unlike AsyncStorage, which is deleted with the app. On a
  // genuine fresh install, AsyncStorage's marker will be missing even though
  // the Keychain may still hold a session/credentials from a previous
  // install.
  useEffect(() => {
    (async () => {
      try {
        const hasLaunchedBefore = await AsyncStorage.getItem(
          FRESH_INSTALL_MARKER_KEY,
        );
        if (hasLaunchedBefore) return;

        setSession(null);
        setUserJson(null);
        await TokenStorage.removeToken();
        await AsyncStorage.setItem(FRESH_INSTALL_MARKER_KEY, "1");
        debug(
          "[Session] Fresh install detected — cleared stale Keychain session",
        );
      } catch (err) {
        error("[Session] Fresh-install session wipe failed:", err);
      }
    })();
  }, [setSession, setUserJson]);

  const handleSignIn = async (credentials: LoginCredentials) => {
    setAuthLoading(true);
    try {
      const result = await apiLogin(credentials);

      if (!("access_token" in result.data)) {
        router.replace({
          pathname: "/onboarding",
          params: { hcpId: String(result.data.id) },
        });
        return "onboarding";
      }

      // Save token and user data
      setSession(result.data.access_token);
      await setAuthToken(result.data.access_token);
      setUserJson(JSON.stringify(result.data.user));

      // Cache this tenant's session so switching back to it later (via
      // switchTenant) can restore it instantly instead of logging in again.
      const activeTenant = useTenantStore.getState().tenant;
      const accessToken = result.data.access_token;
      const cacheSession = async (user: User) => {
        if (!activeTenant) return;
        await Promise.all([
          saveLoginCredentials(
            activeTenant.tenantId,
            credentials.email,
            credentials.password,
          ),
          saveTenantSession(activeTenant.tenantId, {
            accessToken,
            userJson: JSON.stringify(user),
          }),
        ]);
        useTenantStore.getState().markSessionCached(activeTenant.tenantId, {
          name: activeTenant.name,
          logoUrl: activeTenant.logoUrl,
          email: credentials.email,
        });
      };
      await cacheSession(result.data.user);

      // Update profile store if needed
      profileStore.setToken(result.data.access_token);
      profileStore.setUserDetails(result.data.user);
      // Cache profile data for global access
      queryClient.setQueryData(["profile-details"], result.data.user);

      if (needsForcedPasswordReset(result.data.user)) {
        router.replace("/force-password-reset");
        return "password-reset-required";
      }

      // Login to OneSignal for push notifications
      await onLoginSuccess(result.data.user.id.toString());

      try {
        const regStatus = await getRegistrationStatus(
          result.data.access_token,
          result.data.user.hcp.id,
        );

        console.log("[REGSTATUS]", regStatus);
        if (regStatus.data.registration_screen === "0") {
          const completedUser: User = {
            ...result.data.user,
            hcp: { ...result.data.user.hcp, app_registration_screen: "0" },
          };
          setUserJson(JSON.stringify(completedUser));
          profileStore.setUserDetails(completedUser);
          queryClient.setQueryData(["profile-details"], completedUser);
          await cacheSession(completedUser);

          Alert.alert("Success", "Login successful!", [{ text: "OK" }]);
          return "authenticated";
        }

        const onboardingStep = computeOnboardingStep(regStatus.data.steps);

        // Persist the computed step so the next cold open routes correctly.
        const updatedUser: User = {
          ...result.data.user,
          hcp: {
            ...result.data.user.hcp,
            app_registration_screen: String(onboardingStep),
          },
        };
        setUserJson(JSON.stringify(updatedUser));
        profileStore.setUserDetails(updatedUser);
        queryClient.setQueryData(["profile-details"], updatedUser);
        await cacheSession(updatedUser);

        return "onboarding";
      } catch {
        // Fall back to local user data if the status check fails — no
        // explicit redirect needed here either, for the same reason.
        if (getOnboardingRouteParams(result.data.user)) {
          return "onboarding";
        }
      }

      Alert.alert("Success", "Login successful!", [{ text: "OK" }]);
      return "authenticated";
    } catch (err) {
      logApiErrorToSentry(err, {
        endpoint: "/login",
        method: "POST",
      });
      // Handle errors with alerts
      if (err instanceof AuthenticationError) {
        let errorMessage = err.message as string;

        if ((err as any).errors) {
          const errorMessages = Object.values((err as any).errors)
            .flat()
            .join("\n");
          errorMessage = errorMessages || err.message;
        }

        Alert.alert("Login Failed", errorMessage, [{ text: "OK" }]);
      } else if (err instanceof NetworkError) {
        Alert.alert("Connection Error", (err as any).message, [
          { text: "OK" },
          {
            text: "Retry",
            onPress: () => {
              void handleSignIn(credentials).catch(() => undefined);
            },
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again.",
          [{ text: "OK" }],
        );
      }
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetSession = (token: string) => {
    debug("set session called");
    setSession(token);
    setAuthToken(token);
  };

  const handleRetryNotificationSetup = React.useCallback(async () => {
    const subscriptionId = await ensureOneSignalSubscriptionId();

    if (!subscriptionId) {
      return false;
    }

    const activeTenant = useTenantStore.getState().tenant;
    if (!activeTenant) return false;

    const credentials = await getLoginCredentials(activeTenant.tenantId);

    if (!credentials.email || !credentials.password) {
      return false;
    }

    const result = await apiLogin({
      email: credentials.email,
      password: credentials.password,
      device_id: subscriptionId,
    });

    if (!("access_token" in result.data)) {
      router.replace({
        pathname: "/onboarding",
        params: { hcpId: String(result.data.id) },
      });
      return false;
    }

    setSession(result.data.access_token);
    await setAuthToken(result.data.access_token);
    setUserJson(JSON.stringify(result.data.user));
    profileStore.setToken(result.data.access_token);
    profileStore.setUserDetails(result.data.user);
    queryClient.setQueryData(["profile-details"], result.data.user);
    await saveTenantSession(activeTenant.tenantId, {
      accessToken: result.data.access_token,
      userJson: JSON.stringify(result.data.user),
    });
    await onLoginSuccess(result.data.user.id.toString());

    const onboardingParams = getOnboardingRouteParams(result.data.user);
    if (onboardingParams) {
      router.replace({
        pathname: "/onboarding",
        params: onboardingParams,
      });
      return false;
    }

    return true;
  }, [profileStore, queryClient, router, setSession, setUserJson]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await apiLogout();
      // Logout from OneSignal to stop push notifications
      await onLogout();
    } catch (err) {
      error("Logout error:", err);
    } finally {
      // clear local data
      await stopBackgroundTracking();
      setSession(null);
      setUserJson(null);
      removeToken();
      profileStore.clearDetails();
      queryClient.clear();

      // Deliberately leave the active tenant's cached session/credentials/
      // archive in place — signing out is just leaving the live slots
      // empty (the standard "no session" state the Stack.Protected guards
      // route to /(open)/login from). Clearing the archive here would mean
      // the very next switch into this tenant has to log in again, which
      // is the same "logged out" experience this feature exists to avoid.
    }
  }, [profileStore, queryClient, setSession, setUserJson]);

  // Each tenant has its own password and its own self-onboarding — there is
  // no shared credential to silently reuse across tenants. So switching
  // either restores a session this device already cached for that tenant
  // (instant, no network login), or points the app at that tenant and lets
  // it show that tenant's own login screen via the existing Stack.Protected
  // guards in app/_layout.tsx — the same mechanism an ordinary sign-out
  // already uses, just pointed at a different tenant.
  const handleSwitchTenant = React.useCallback(
    async (
      tenant: TenantSummary,
      emailOverride?: string,
    ): Promise<TenantSwitchResult> => {
      const currentTenant = useTenantStore.getState().tenant;
      // emailOverride covers login.tsx's inline switcher, where the typed
      // email can differ from whichever tenant is currently persisted
      // (e.g. no session yet) — everywhere else switches within the same
      // email's organizations, so the persisted tenant's email is right.
      const targetEmail = emailOverride ?? currentTenant?.email;
      if (!targetEmail) return "failed";
      if (currentTenant?.tenantId === tenant.tenantId) return "switched";

      // Everything below briefly sends the new tenant's X-Tenant-Code
      // alongside the still-old token/no token — any other screen's
      // in-flight or background-refetching query can 401 on that mismatch
      // and would otherwise trip the global auth-expired handler and force
      // a sign-out out from under us. Suppress it and be the sole
      // authority on success/failure here.
      setAuthExpiredSuppressed(true);

      try {
        // Stop anything already in flight under the old tenant/token from
        // resolving into that mismatch after we've moved on.
        await queryClient.cancelQueries();

        // Archive the outgoing tenant's live session first — even if the
        // target isn't cached and we're about to show its login screen,
        // this tenant must still be instant-switchable when coming back.
        if (currentTenant && session && userJson) {
          await saveTenantSession(currentTenant.tenantId, {
            accessToken: session,
            userJson,
          });
          useTenantStore
            .getState()
            .markSessionCached(currentTenant.tenantId, {
              name: currentTenant.name,
              logoUrl: currentTenant.logoUrl,
              email: currentTenant.email,
            });
        }

        const archived = await getTenantSession(tenant.tenantId);

        if (archived) {
          try {
            const cachedUser = JSON.parse(archived.userJson) as User;
            const hcpId = cachedUser?.hcp?.id;
            if (!hcpId) throw new Error("Cached session has no hcp id");

            // getTenantHeaders() (used inside getRegistrationStatus) reads
            // whichever tenant is CURRENTLY active from the store — point
            // it at the target tenant first, or this validation call sends
            // the new tenant's archived token with the old tenant's
            // X-Tenant-Code header, the backend 401s on that mismatch, and
            // the cached session gets wrongly treated as stale/revoked on
            // every single switch.
            useTenantStore.getState().setTenant(tenant, targetEmail);

            // Every real API call (every GET fetcher, every mutation) reads
            // its Authorization token from TokenStorage's "access_token"
            // SecureStore key, NOT from `session`/setAuthToken's
            // "authToken-ishapps" key — those only drive route-gating.
            // Updating this as early as possible (before the validation
            // call, let alone the rest of the commit below) closes the
            // window where any other in-flight or background-refetching
            // request would otherwise pair the new tenant's header with the
            // previous tenant's stale token and 401, which is what was
            // forcing a sign-out right after an apparently-successful
            // instant switch.
            await TokenStorage.saveToken(archived.accessToken);

            // Confirms the archived token still works (it may have been
            // revoked/expired server-side) and refreshes onboarding status
            // in one call, before committing to the swap.
            const regStatus = await getRegistrationStatus(
              archived.accessToken,
              hcpId,
            );

            const refreshedUser: User = {
              ...cachedUser,
              hcp: {
                ...cachedUser.hcp,
                app_registration_screen:
                  regStatus.data.registration_screen === "0"
                    ? "0"
                    : String(computeOnboardingStep(regStatus.data.steps)),
              },
            };

            await stopBackgroundTracking();
            profileStore.clearDetails();
            queryClient.clear();

            setSession(archived.accessToken);
            await setAuthToken(archived.accessToken);
            setUserJson(JSON.stringify(refreshedUser));
            profileStore.setToken(archived.accessToken);
            profileStore.setUserDetails(refreshedUser);
            queryClient.setQueryData(["profile-details"], refreshedUser);
            await saveTenantSession(tenant.tenantId, {
              accessToken: archived.accessToken,
              userJson: JSON.stringify(refreshedUser),
            });
            await onLoginSuccess(refreshedUser.id.toString());

            if (needsForcedPasswordReset(refreshedUser)) {
              router.replace("/force-password-reset");
            }

            return "switched";
          } catch (err) {
            // Stale/revoked cached token — drop the archive and fall
            // through to a fresh login for this tenant instead.
            logApiErrorToSentry(err, {
              endpoint: "/hcps/{hcpId}/onboarding-status",
              method: "GET",
            });
            await clearTenantSession(tenant.tenantId);
            useTenantStore.getState().removeCachedSession(tenant.tenantId);
          }
        }

        // No usable cached session for this tenant — point the app at it
        // and let it show that tenant's own login screen (and onboarding,
        // if that HCP hasn't completed it there yet).
        await stopBackgroundTracking();
        useTenantStore.getState().setTenant(tenant, targetEmail);
        profileStore.clearDetails();
        queryClient.clear();
        setSession(null);
        setUserJson(null);
        await removeToken();
        await TokenStorage.removeToken();

        return "needs-login";
      } catch (err) {
        logApiErrorToSentry(err, { endpoint: "/login", method: "POST" });
        Alert.alert("Couldn't switch organizations", "Please try again.");
        return "failed";
      } finally {
        setAuthExpiredSuppressed(false);
      }
    },
    [profileStore, queryClient, router, session, setSession, setUserJson, userJson],
  );

  useEffect(() => {
    return registerTenantSwitchHandler(handleSwitchTenant);
  }, [handleSwitchTenant]);

  const handleUpdateHcp = React.useCallback(
    (patch: Partial<Hcp>) => {
      const currentUser = user;
      if (!currentUser) return;
      const mergedHcp = { ...currentUser.hcp, ...patch };
      const updatedUser: User = {
        ...currentUser,
        // The profile header/list show `user.name`, a separate top-level
        // field the backend derives as trim(first_name + ' ' + last_name) —
        // keep it in sync here too, or it stays stale until the next login.
        name:
          patch.first_name !== undefined || patch.last_name !== undefined
            ? `${mergedHcp.first_name} ${mergedHcp.last_name}`.trim()
            : currentUser.name,
        hcp: mergedHcp,
      };
      setUserJson(JSON.stringify(updatedUser));
      profileStore.setUserDetails(updatedUser);
      queryClient.setQueryData(["profile-details"], updatedUser);
    },
    [user, setUserJson, profileStore, queryClient],
  );

  useEffect(() => {
    return registerAuthExpiredHandler(async ({ message }) => {
      await handleSignOut();
      Alert.alert("Session Expired", message, [{ text: "OK" }]);
    });
  }, [handleSignOut]);

  return (
    <AuthContext.Provider
      value={{
        signIn: handleSignIn,
        retryNotificationSetup: handleRetryNotificationSetup,
        setSess: handleSetSession,
        signOut: handleSignOut,
        updateHcp: handleUpdateHcp,
        switchTenant: handleSwitchTenant,
        session,
        user,
        isLoading: isHydrating || isHydratingUser || authLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
