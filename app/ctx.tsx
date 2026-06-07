import {
  logApiErrorToSentry,
  registerAuthExpiredHandler,
} from "@/api-actions/error-utils";
import { useProfileData } from "@/data-store/use-account-store";
import LoginCredentials, { User } from "@/data-types/auth";
import {
  ensureOneSignalSubscriptionId,
  onLoginSuccess,
} from "@/hooks/use-one-signal";
import { stopBackgroundTracking } from "@/task-services/locationTask";
import { removeToken, setToken as setAuthToken } from "@/utils/auth";
import {
  login as apiLogin,
  logout as apiLogout,
  AuthenticationError,
  NetworkError,
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
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { useStorageState } from "./useStorageState";

const AuthContext = React.createContext<{
  signIn: (data: LoginCredentials) => Promise<"authenticated" | "onboarding">;
  retryNotificationSetup: () => Promise<boolean>;
  setSess: (data: string) => void;
  signOut: () => void;
  session?: string | null;
  user?: User | null;
  isLoading: boolean;
}>({
  signIn: () => Promise.resolve("authenticated"),
  retryNotificationSetup: () => Promise.resolve(false),
  setSess: () => null,
  signOut: () => null,
  session: null,
  user: null,
  isLoading: false,
});

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

const getOnboardingRouteParams = (user?: User | null) => {
  const hcp = user?.hcp;
  const registrationScreen = hcp?.app_registration_screen;

  if (!hcp?.id || !registrationScreen || registrationScreen === "0") {
    return null;
  }

  return {
    hcpId: String(hcp.id),
    screen: registrationScreen,
  };
};

export function useProtectedRoute(
  session: string | null | undefined,
  user: User | null,
) {
  const segments = useSegments();
  const router = useRouter();
  debug("session", session);

  const pathname = usePathname();
  const currentRoute = pathname === "/(open)/index";
  useEffect(() => {
    const inAuthGroup = segments[0] === "(open)";
    const inOnboarding = segments[0] === "onboarding";
    const onboardingParams = getOnboardingRouteParams(user);

    if (!session && !inAuthGroup && currentRoute) {
      // Redirect to the sign-in page.
      router.replace("/(open)/login");
    } else if (session && onboardingParams && !inOnboarding) {
      router.replace({
        pathname: "/onboarding",
        params: onboardingParams,
      });
    } else if (
      session &&
      !onboardingParams &&
      ((inAuthGroup && !inOnboarding) || currentRoute)
    ) {
      // Redirect to the home page.
      router.replace("/(tabs)");
    }
  }, [currentRoute, router, segments, session, user]);
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

  useProtectedRoute(session, user);

  useEffect(() => {
    incrementProviderMount("SessionProvider");

    return () => {
      incrementProviderUnmount("SessionProvider");
    };
  }, []);

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
      await saveLoginCredentials(credentials.email, credentials.password);

      // Update profile store if needed
      profileStore.setToken(result.data.access_token);
      profileStore.setUserDetails(result.data.user);
      // Cache profile data for global access
      queryClient.setQueryData(["profile-details"], result.data.user);

      // Login to OneSignal for push notifications
      await onLoginSuccess(result.data.user.id.toString());

      const onboardingParams = getOnboardingRouteParams(result.data.user);
      if (onboardingParams) {
        router.replace({
          pathname: "/onboarding",
          params: onboardingParams,
        });
        return "onboarding";
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

    const credentials = await getLoginCredentials();

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
      // await onLogout();
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
    }
  }, [profileStore, queryClient, setSession, setUserJson]);

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
        session,
        user,
        isLoading: isHydrating || isHydratingUser || authLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
