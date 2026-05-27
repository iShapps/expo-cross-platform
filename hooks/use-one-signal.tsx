import { useSession } from "@/app/ctx";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { AppNotification } from "@/data-types/notifications";
import {
  decrementOneSignalListeners,
  incrementOneSignalListeners,
  markOneSignalInitialized,
} from "@/utils/runtime-diagnostics";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  LogLevel,
  NotificationClickEvent,
  NotificationWillDisplayEvent,
  OneSignal,
} from "react-native-onesignal";

let oneSignalInitialized = false;
let activeOneSignalSyncKey: string | null = null;
let lastOneSignalSyncKey: string | null = null;

const debugLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

const getOneSignalAppId = () =>
  Constants.expoConfig?.extra?.eas?.oneSignalAppId as string | undefined;

const initializeOneSignal = () => {
  const appId = getOneSignalAppId();

  if (!appId) {
    console.warn("OneSignal App ID is missing in app.json extra config");
    return false;
  }

  if (!oneSignalInitialized) {
    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }

    OneSignal.initialize(appId);
    oneSignalInitialized = true;
    markOneSignalInitialized();
    debugLog("OneSignal initialized");
  }

  return true;
};

const registerOneSignalListeners = () => {
  OneSignal.Notifications.addEventListener(
    "foregroundWillDisplay",
    handleForegroundNotification,
  );
  OneSignal.Notifications.addEventListener("click", handleNotificationClick);
  OneSignal.User.pushSubscription.addEventListener(
    "change",
    handlePushSubscriptionChange,
  );
  incrementOneSignalListeners(3);

  return () => {
    OneSignal.Notifications.removeEventListener(
      "foregroundWillDisplay",
      handleForegroundNotification,
    );
    OneSignal.Notifications.removeEventListener("click", handleNotificationClick);
    OneSignal.User.pushSubscription.removeEventListener(
      "change",
      handlePushSubscriptionChange,
    );
    decrementOneSignalListeners(3);
  };
};

const handleNotificationClick = (event: NotificationClickEvent) => {
  debugLog("Notification clicked:", event);
  const notification = extractNotification(event);

  if (notification?.additionalData) {
    switch (notification.additionalData.notification_type) {
      case "shifts":
        router.navigate(`/${notification.additionalData.shift_id.toString()}`);
        break;
      case "documents":
        router.navigate("/documents");
        break;
      default:
        router.navigate("/notifications");
        break;
    }
  }
};

const handleForegroundNotification = (event: NotificationWillDisplayEvent) => {
  debugLog("Notification received in foreground:", event);
  event.getNotification().display();
};

const handlePushSubscriptionChange = (event: any) => {
  debugLog("Push Subscription changed:", event);
  debugLog("New Subscription ID:", event.current?.id);
};

export const useOneSignal = () => {
  const notificationsEnabled = useSettingsStore(
    (state) => state.notificationsEnabled,
  );
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);
  const session = useSession();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const didInitialize = initializeOneSignal();
    setInitialized(didInitialize);

    if (!didInitialize) return;

    return registerOneSignalListeners();
  }, []);

  useEffect(() => {
    if (!oneSignalInitialized || !hasHydrated) return;

    const syncKey = `${notificationsEnabled ? "enabled" : "disabled"}:${
      session?.user?.id ?? "anonymous"
    }`;

    if (activeOneSignalSyncKey === syncKey || lastOneSignalSyncKey === syncKey) {
      return;
    }

    let cancelled = false;
    activeOneSignalSyncKey = syncKey;

    const handleNotificationState = async () => {
      try {
        if (notificationsEnabled) {
          debugLog("Notifications enabled — syncing OneSignal...");

          const alreadyGranted =
            await OneSignal.Notifications.getPermissionAsync();

          if (!alreadyGranted) {
            const canRequest =
              await OneSignal.Notifications.canRequestPermission();

            if (canRequest) {
              const granted =
                await OneSignal.Notifications.requestPermission(true);
              debugLog("Permission granted:", granted);

              if (!granted) return;
            } else {
              debugLog(
                "Cannot request permission — user must enable in device settings",
              );
              return;
            }
          }

          if (session?.user?.id) {
            await OneSignal.login(String(session.user.id));
            debugLog("Logged into OneSignal with user:", session.user.id);

            const subscriptionId =
              await OneSignal.User.pushSubscription.getIdAsync();
            debugLog("OneSignal Subscription ID:", subscriptionId);
          }

          await OneSignal.User.pushSubscription.optIn();
        } else {
          debugLog("Notifications disabled — opting out of push...");
          await OneSignal.User.pushSubscription.optOut();
        }

        if (!cancelled) {
          lastOneSignalSyncKey = syncKey;
        }
      } finally {
        if (activeOneSignalSyncKey === syncKey) {
          activeOneSignalSyncKey = null;
        }
      }
    };

    void handleNotificationState();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, notificationsEnabled, session?.user?.id]);

  return {
    isInitialized: initialized,
  };
};

export const onLoginSuccess = async (userId: string) => {
  try {
    debugLog("Logging into OneSignal with user:", userId);
    await OneSignal.login(userId);

    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();

    debugLog("User logged in to OneSignal");
    debugLog("External ID:", userId);
    debugLog("Subscription ID:", subscriptionId);

    return subscriptionId;
  } catch (error) {
    console.error("OneSignal login error:", error);
    throw error;
  }
};

export const onLogout = async () => {
  try {
    debugLog("Logging out from OneSignal");
    await OneSignal.logout();
    debugLog("Logged out from OneSignal successfully");
  } catch (error) {
    console.error("OneSignal logout error:", error);
  }
};

export const getSubscriptionId = async (): Promise<string | null> => {
  try {
    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
    return subscriptionId;
  } catch (error) {
    console.error("Error getting subscription ID:", error);
    return null;
  }
};

export const getNotificationPermissionStatus = async () => {
  try {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    const canRequest = await OneSignal.Notifications.canRequestPermission();

    return {
      hasPermission,
      canRequest,
    };
  } catch (error) {
    console.error("Error checking notification permission:", error);
    return {
      hasPermission: false,
      canRequest: false,
    };
  }
};

export const useOneSignalSubscriptionStatus = () => {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const refresh = useCallback(async () => {
    setIsChecking(true);
    initializeOneSignal();

    try {
      const id = await OneSignal.User.pushSubscription.getIdAsync();
      setSubscriptionId(id);
    } catch (error) {
      console.error("Error checking OneSignal subscription ID:", error);
      setSubscriptionId(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const listener = (event: any) => {
      setSubscriptionId(event.current?.id ?? null);
    };

    refresh();
    OneSignal.User.pushSubscription.addEventListener("change", listener);
    incrementOneSignalListeners();

    return () => {
      OneSignal.User.pushSubscription.removeEventListener("change", listener);
      decrementOneSignalListeners();
    };
  }, [refresh]);

  return {
    isChecking,
    isSetup: !!subscriptionId,
    refresh,
    subscriptionId,
  };
};

const extractNotification = (
  event: NotificationClickEvent | NotificationWillDisplayEvent,
): AppNotification => {
  return event.notification as AppNotification;
};

export const waitForSubscriptionId = async (
  timeoutMs = 10000,
): Promise<string | null> => {
  let subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();

  if (subscriptionId) return subscriptionId;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      OneSignal.User.pushSubscription.removeEventListener("change", listener);
      decrementOneSignalListeners();
      resolve(null);
    }, timeoutMs);

    const listener = (event: any) => {
      const id = event.current?.id;

      if (id) {
        clearTimeout(timeout);
        OneSignal.User.pushSubscription.removeEventListener("change", listener);
        decrementOneSignalListeners();
        resolve(id);
      }
    };

    OneSignal.User.pushSubscription.addEventListener("change", listener);
    incrementOneSignalListeners();
  });
};

export const ensureOneSignalSubscriptionId = async (
  timeoutMs = 10000,
): Promise<string | null> => {
  if (!initializeOneSignal()) return null;

  const alreadyGranted = await OneSignal.Notifications.getPermissionAsync();
  let hasPermission = alreadyGranted;

  if (!hasPermission) {
    const canRequest = await OneSignal.Notifications.canRequestPermission();
    if (!canRequest) return null;

    hasPermission = await OneSignal.Notifications.requestPermission(true);
  }

  if (!hasPermission) return null;

  await OneSignal.User.pushSubscription.optIn();

  return waitForSubscriptionId(timeoutMs);
};
