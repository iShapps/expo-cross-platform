import { useProfileData } from "@/data-store/use-account-store";
import { LoginData } from "@/data-types/auth";
import { removeToken, setToken } from "@/utils/auth";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { useStorageState } from "./useStorageState";

const AuthContext = React.createContext<{
  signIn: (data: LoginData) => Promise<void>;
  setSess: (data: string) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => Promise.resolve(),
  setSess: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
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

    // console.log('currentRoute',currentRoute)
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
      // Redirect away from the sign-in page.
      router.replace("/(tabs)");
    }
  }, [user, segments]);
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [[isLoading, session], setSession] =
    useStorageState("authToken-ishapps");

  useProtectedRoute(session);
  //   const authApi = new AuthApi()
  const profileStore = useProfileData();
  const handleSignIn = async (data: LoginData) => {
    try {
      const loginRes = {
        token: "token",
      };
      //   await authApi.login(data)
      setSession(loginRes.token);
      setToken(loginRes.token);

      profileStore.setToken(loginRes.token);
    } catch (error) {
      throw error;
    }
  };

  const handleSetSession = (token: string) => {
    console.log("called");
    setSession(token);
    setToken(token);
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: handleSignIn,
        setSess: handleSetSession,
        signOut: () => {
          setSession(null);
          removeToken();
          profileStore.clearDetails();
        },
        session,
        isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
