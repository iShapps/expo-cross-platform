import { useSettingsStore } from "@/data-store/use-settings-store";
import { useOneSignal } from "@/hooks/use-one-signal";
import { useOTAUpdate } from "@/hooks/use-ota-update";
import { usePermissionMonitor } from "@/hooks/use-permission-monitor";
import { useShiftWatcher } from "@/hooks/use-shift-watcher";
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
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalUpdateGate } from "../components/global-update-gate";
import { SessionProvider, useSession } from "./ctx";
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

    // Configure Session Replay
    replaysSessionSampleRate: 0.05, // Capture 5% of all sessions for replay
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors for replay
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
      Sentry.reactNativeTracingIntegration(),
    ],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    spotlight: __DEV__,
  });

  sentryGlobal.__ISHAPPS_SENTRY_INITIALIZED__ = true;
}

// onlineManager.setEventListener((setOnline) => {
//   const eventSubscription = Network.addNetworkStateListener((state) => {
//     setOnline(!!state.isConnected)
//   })
//   return eventSubscription.remove
// })

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default Sentry.wrap(function Root() {
  incrementRootRenderCount();

  useEffect(() => {
    if (Platform.OS === "web") return;

    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    focusManager.setFocused(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (status) => {
      incrementAppStateTransitionCount();
      if (focusTimer) {
        clearTimeout(focusTimer);
      }

      focusTimer = setTimeout(() => {
        focusManager.setFocused(status === "active");
      }, 300);
    });
    incrementAppStateListeners();

    return () => {
      if (focusTimer) {
        clearTimeout(focusTimer);
      }
      subscription.remove();
      decrementAppStateListeners();
    };
  }, []);

  useEffect(() => {
    incrementProviderMount("Root");

    return () => {
      incrementProviderUnmount("Root");
    };
  }, []);

  useEffect(() => {
    console.log("Initializing app...");
    const initializeApp = async () => {
      const store = useSettingsStore.getState();
      await store.hydrate();
      await store.requestAllPermissionsOnLaunch();
    };
    initializeApp();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AppLifecycleHooks />
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

    return () => {
      incrementProviderUnmount("AppLifecycleHooks");
    };
  }, []);

  return null;
}

function RootNavigator() {
  const { session } = useSession();

  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="(tabs)"
        />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="(main)"
        />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="(open)"
        />
      </Stack.Protected>

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
    </Stack>
  );
}
