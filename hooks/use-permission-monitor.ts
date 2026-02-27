import { useSettingsStore } from "@/data-store/use-settings-store";
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

export const usePermissionMonitor = () => {
  const checkPermissions = useSettingsStore((state) => state.checkPermissions);

  useEffect(() => {
    // Check permissions when app loads in foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkPermissions();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    checkPermissions();

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);
};
