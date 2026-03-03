import { useProfileData } from "@/data-store/use-account-store";
import LoginCredentials, { User } from "@/data-types/auth";
import { removeToken, setToken as setAuthToken } from "@/utils/auth";
import {
  login as apiLogin,
  logout as apiLogout,
  AuthenticationError,
  NetworkError,
} from "@/utils/auth-api";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { useStorageState } from "./useStorageState";

const AuthContext = React.createContext<{
  signIn: (data: LoginCredentials) => Promise<void>;
  setSess: (data: string) => void;
  signOut: () => void;
  session?: string | null;
  user?: User | null;
  isLoading: boolean;
}>({
  signIn: () => Promise.resolve(),
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

export function useProtectedRoute(user: any) {
  const segments = useSegments();
  const router = useRouter();
  console.log("user", user);

  const currentRoute = usePathname() === "/(open)/index";
  useEffect(() => {
    const inAuthGroup = segments[0] === "(open)";

    console.log("inAuthGroup", inAuthGroup);

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !user &&
      !inAuthGroup &&
      currentRoute
    ) {
      // Redirect to the sign-in page.
      router.replace("/(open)/login");
    } else if ((user && inAuthGroup) || (user && currentRoute)) {
      // Redirect to the home page.
      router.replace("/(tabs)");
    }
  }, [user, segments]);
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [[isHydrating, session], setSession] =
    useStorageState("authToken-ishapps");
  const [[isHydratingUser, userJson], setUserJson] =
    useStorageState("user_data");

  const [authLoading, setAuthLoading] = React.useState(false);

  useProtectedRoute(session);
  const profileStore = useProfileData();
  const queryClient = useQueryClient();

  const user = userJson ? JSON.parse(userJson) : null;

  const handleSignIn = async (credentials: LoginCredentials) => {
    setAuthLoading(true);
    try {
      const result = await apiLogin(credentials);

      // Save token and user data
      setSession(result.data.access_token);
      setAuthToken(result.data.access_token);
      setUserJson(JSON.stringify(result.data.user));

      // Update profile store if needed
      profileStore.setToken(result.data.access_token);
      profileStore.setUserDetails(result.data.user);
      // Cache profile data for global access
      queryClient.setQueryData(["profile-details"], result.data.user);

      // Login to OneSignal for push notifications
      // await onLoginSuccess(result.data.user.id.toString());

      Alert.alert("Success", "Login successful!", [{ text: "OK" }]);
    } catch (error) {
      // Handle errors with alerts
      if (error instanceof AuthenticationError) {
        let errorMessage = error.message;

        if (error.errors) {
          const errorMessages = Object.values(error.errors).flat().join("\n");
          errorMessage = errorMessages || error.message;
        }

        Alert.alert("Login Failed", errorMessage, [{ text: "OK" }]);
      } else if (error instanceof NetworkError) {
        Alert.alert("Connection Error", error.message, [
          { text: "OK" },
          {
            text: "Retry",
            onPress: () => handleSignIn(credentials),
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again.",
          [{ text: "OK" }],
        );
      }
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetSession = (token: string) => {
    console.log("called");
    setSession(token);
    setAuthToken(token);
  };

  const handleSignOut = async () => {
    try {
      await apiLogout();
      // Logout from OneSignal to stop push notifications
      // await onLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // clear local data
      setSession(null);
      setUserJson(null);
      removeToken();
      profileStore.clearDetails();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: handleSignIn,
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
