import { useSettingsStore } from "@/data-store/use-settings-store";
import { useOneSignal } from "@/hooks/use-one-signal";
import { usePermissionMonitor } from "@/hooks/use-permission-monitor";
import { useShiftWatcher } from "@/hooks/use-shift-watcher";
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

// onlineManager.setEventListener((setOnline) => {
//   const eventSubscription = Network.addNetworkStateListener((state) => {
//     setOnline(!!state.isConnected)
//   })
//   return eventSubscription.remove
// })

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function Root() {
  useShiftWatcher();
  useOneSignal();
  usePermissionMonitor();

  useEffect(() => {
    if (Platform.OS === "web") return;

    focusManager.setFocused(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });

    return () => subscription.remove();
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
          <SplashScreenController>
            <RootNavigator />
            <GlobalUpdateGate />
          </SplashScreenController>
        </SessionProvider>
      </QueryClientProvider>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
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
