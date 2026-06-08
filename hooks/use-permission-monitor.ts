import { useSettingsStore } from "@/data-store/use-settings-store";
import {
  decrementAppStateListeners,
  incrementAppStateListeners,
  incrementAppStateTransitionCount,
} from "@/utils/runtime-diagnostics";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

export const usePermissionMonitor = () => {
  const checkPermissions = useSettingsStore((state) => state.checkPermissions);
  const requestAllPermissionsOnLaunch = useSettingsStore(
    (state) => state.requestAllPermissionsOnLaunch,
  );
  const hasRequestedOnLaunch = useRef(false);

  // Initial launch request
  useEffect(() => {
    if (!hasRequestedOnLaunch.current) {
      hasRequestedOnLaunch.current = true;
      requestAllPermissionsOnLaunch();
    }
  }, [requestAllPermissionsOnLaunch]);

  // Foreground checks
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      incrementAppStateTransitionCount();
      if (nextAppState === "active") {
        checkPermissions();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    incrementAppStateListeners();
    checkPermissions();

    return () => {
      subscription.remove();
      decrementAppStateListeners();
    };
  }, [checkPermissions]);
};
