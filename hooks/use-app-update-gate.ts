import { getGeneralAppConfigs } from "@/api-queries/configs";
import { useConfigSettings } from "@/data-store/config-store";
import { IConfigResponse } from "@/data-types/config";
import {
  decrementAppStateListeners,
  incrementAppStateListeners,
  incrementAppStateTransitionCount,
  setStartupStabilized,
} from "@/utils/runtime-diagnostics";
import { waitForStableAppState } from "@/utils/wait-for-stable-app-state";
import { useQuery } from "@tanstack/react-query";
import * as Application from "expo-application";
import { useEffect, useState } from "react";
import { AppState, Linking, Platform } from "react-native";

const normalizeVersionPart = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const compareVersions = (currentVersion: string, requiredVersion: string) => {
  const currentParts = currentVersion.split(".").map(normalizeVersionPart);
  const requiredParts = requiredVersion.split(".").map(normalizeVersionPart);
  const maxLength = Math.max(currentParts.length, requiredParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const current = currentParts[index] ?? 0;
    const required = requiredParts[index] ?? 0;

    if (current < required) return -1;
    if (current > required) return 1;
  }

  return 0;
};

export const useAppUpdateGate = () => {
  const [bootstrapReady, setBootstrapReady] = useState(
    Platform.OS !== "android",
  );
  const storedConfigSettings = useConfigSettings(
    (state) => state.configSettings,
  );
  const setConfigSettings = useConfigSettings(
    (state) => state.setConfigSettings,
  );

  useEffect(() => {
    if (Platform.OS !== "android") {
      setStartupStabilized(true);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let appStateSubscription: { remove: () => void } | undefined;
    let didSetReady = false;

    const setReadyIfActive = async () => {
      if (didSetReady || AppState.currentState !== "active") return;

      // Wait for app state to truly stabilize on Android
      // This detects and waits for pause/resume transitions to complete
      await waitForStableAppState(1200);

      if (didSetReady || AppState.currentState !== "active") return;
      didSetReady = true;
      setBootstrapReady(true);
      setStartupStabilized(true);
      if (appStateSubscription) {
        appStateSubscription.remove();
        appStateSubscription = undefined;
        decrementAppStateListeners();
      }
    };

    // Use setTimeout instead of deprecated InteractionManager.runAfterInteractions
    // The 3000ms delay provides sufficient time for interactions to settle
    timeoutId = setTimeout(() => {
      if (AppState.currentState === "active") {
        void setReadyIfActive();
        return;
      }

      appStateSubscription = AppState.addEventListener("change", () => {
        incrementAppStateTransitionCount();
        void setReadyIfActive();
      });
      incrementAppStateListeners();
    }, 3000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (appStateSubscription) {
        appStateSubscription.remove();
        decrementAppStateListeners();
      }
    };
  }, []);

  const { data: configResponse } = useQuery<IConfigResponse>({
    queryKey: ["config-settings"],
    queryFn: () => getGeneralAppConfigs(),
    enabled: bootstrapReady && AppState.currentState === "active",
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 60 * 24,
    refetchInterval: 1000 * 60 * 60 * 24,
    refetchIntervalInBackground: false,
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!configResponse?.data) return;
    setConfigSettings(configResponse.data);
  }, [configResponse, setConfigSettings]);

  const configSettings = configResponse?.data ?? storedConfigSettings;
  const installedAppVersion = Application.nativeApplicationVersion ?? "0.0.0";
  const requiredAppVersion =
    Platform.OS === "ios"
      ? configSettings?.configuration?.ios_app_version
      : configSettings?.configuration?.android_app_version;
  const storeLink =
    Platform.OS === "ios"
      ? configSettings?.configuration?.ios_app_link
      : configSettings?.configuration?.android_app_link;
  const isUpdateRequired =
    !!requiredAppVersion &&
    compareVersions(installedAppVersion, requiredAppVersion) < 0;

  const openStore = async () => {
    if (!storeLink) return;

    const supported = await Linking.canOpenURL(storeLink);
    if (supported) {
      await Linking.openURL(storeLink);
    }
  };

  return {
    installedAppVersion,
    isUpdateRequired,
    openStore,
    requiredAppVersion,
    storeLink,
  };
};
