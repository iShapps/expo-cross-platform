import { useShiftWatcher } from "@/hooks/use-shift-watcher";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
  // Set up the auth context
  useShiftWatcher();
  return (
    <GestureHandlerRootView>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <SplashScreenController />
          <RootNavigator />
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { session } = useSession();
  // initiate one signal before login
  // useOneSignal();

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
    </Stack>
  );
}
