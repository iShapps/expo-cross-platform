import * as Updates from "expo-updates";
import { useEffect } from "react";

export function useOTAUpdate() {
  useEffect(() => {
    async function checkAndApply() {
      // Don't run OTA in development
      if (__DEV__) return;

      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Reloads the app immediately with the new bundle
          await Updates.reloadAsync();
          // Alert.alert(
          //   "Update available",
          //   "iShapps has some new updates ready. Restart now?",
          //   [{ text: "Restart", onPress: () => Updates.reloadAsync() }],
          // );
        }
      } catch (e) {
        console.warn("OTA update check failed:", e);
      }
    }

    checkAndApply();
  }, []);
}
