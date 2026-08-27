import { useSettingsStore } from "@/data-store/use-settings-store";
import { useOneSignal } from "@/hooks/use-one-signal";
import { useOTAUpdate } from "@/hooks/use-ota-update";
import { usePermissionMonitor } from "@/hooks/use-permission-monitor";
import { useShiftWatcher } from "@/hooks/use-shift-watcher";
import { debug } from "@/utils/logger";
import {
  decrementAppStateListeners,
  incrementAppStateListeners,
  incrementAppStateTransitionCount,
  incrementProviderMount,
  incrementProviderUnmount,
  incrementRootRenderCount,
} from "@/utils/runtime-diagnostics";
import * as Sentry from "@sentry/react-native";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { SplashScreen, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalUpdateGate } from "../components/global-update-gate";
import { SupportFab } from "../components/support-fab";
import { getOnboardingRouteParams, SessionProvider, useSession } from "./ctx";
import { SplashScreenController } from "./splash";

const sentryGlobal = globalThis as typeof globalThis & {
  __ISHAPPS_SENTRY_INITIALIZED__?: boolean;
};

if (!sentryGlobal.__ISHAPPS_SENTRY_INITIALIZED__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    enableLogs: true,
    debug: __DEV__,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
      Sentry.reactNativeTracingIntegration(),
    ],
    spotlight: __DEV__,
  });
  sentryGlobal.__ISHAPPS_SENTRY_INITIALIZED__ = true;
}

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default Sentry.wrap(function Root() {
  incrementRootRenderCount();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    focusManager.setFocused(AppState.currentState === "active");

    const subscription = AppState.addEventListener("change", (status) => {
      incrementAppStateTransitionCount();
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        focusManager.setFocused(status === "active");
      }, 300);
    });
    incrementAppStateListeners();

    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      subscription.remove();
      decrementAppStateListeners();
    };
  }, []);

  useEffect(() => {
    incrementProviderMount("Root");
    return () => incrementProviderUnmount("Root");
  }, []);

  // Single hydration source of truth
  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      debug("Initializing app...");
      const store = useSettingsStore.getState();
      await store.hydrate();

      if (!cancelled) {
        setIsHydrated(true);
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {isHydrated && <AppLifecycleHooks />}
          <SplashScreenController>
            <RootNavigator />
            <GlobalUpdateGate />
          </SplashScreenController>
        </SessionProvider>
      </QueryClientProvider>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
});

function AppLifecycleHooks() {
  useOTAUpdate();
  useShiftWatcher();
  useOneSignal();
  usePermissionMonitor();

  useEffect(() => {
    incrementProviderMount("AppLifecycleHooks");
    return () => incrementProviderUnmount("AppLifecycleHooks");
  }, []);

  return null;
}

function RootNavigator() {
  const { session, user, isLoading } = useSession();
  const pathname = usePathname();
  // Registration status/user data hasn't settled yet (hydrating or a login
  // is actively resolving)
  const needsOnboarding = !!getOnboardingRouteParams(user);
  const canEnterMainApp = !!session && !isLoading && !needsOnboarding;
  // A login is actively resolving (setSession fires before the registration
  // status check finishes, while isLoading/authLoading is still true)
  const canEnterAuthGroup = !session || isLoading;

  return (
    <>
      <Stack>
        <Stack.Protected guard={canEnterMainApp}>
          <Stack.Screen options={{ headerShown: false }} name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={canEnterMainApp}>
          <Stack.Screen options={{ headerShown: false }} name="(main)" />
        </Stack.Protected>
        <Stack.Protected guard={canEnterAuthGroup}>
          <Stack.Screen options={{ headerShown: false }} name="(open)" />
        </Stack.Protected>

        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="review"
          options={{
            headerShown: false,
            presentation: "transparentModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="date-sheet"
          options={{
            headerShown: false,
            presentation: "transparentModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="support-chat"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
      {!!session && pathname !== "/support-chat" && <SupportFab />}
    </>
  );
}
