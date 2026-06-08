import { useSession } from "@/app/ctx";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { AppNotification } from "@/data-types/notifications";
import { debug, error, warn } from "@/utils/logger";
import {
  decrementOneSignalListeners,
  incrementOneSignalListeners,
  markOneSignalInitialized,
} from "@/utils/runtime-diagnostics";
import { waitForStableAppState } from "@/utils/wait-for-stable-app-state";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LogLevel,
  NotificationClickEvent,
  NotificationWillDisplayEvent,
  OneSignal,
} from "react-native-onesignal";

let oneSignalInitialized = false;
let activeOneSignalSyncKey: string | null = null;
let lastOneSignalSyncKey: string | null = null;
let hasRequestedPermissionThisSession = false; // prevent double requests

const getOneSignalAppId = () =>
  Constants.expoConfig?.extra?.eas?.oneSignalAppId as string | undefined;

const initializeOneSignal = () => {
  const appId = getOneSignalAppId();

  if (!appId) {
    warn("OneSignal App ID is missing in app.json extra config");
    return false;
  }

  if (!oneSignalInitialized) {
    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }

    OneSignal.initialize(appId);
    oneSignalInitialized = true;
    markOneSignalInitialized();
    debug("OneSignal initialized");
  }

  return true;
};

const handleNotificationClick = (event: NotificationClickEvent) => {
  debug("Notification clicked:", event);
  const notification = extractNotification(event);

  if (notification?.additionalData) {
    switch (notification.additionalData.notification_type) {
      case "shifts":
        router.navigate(`/${notification.additionalData.shift_id.toString()}`);
        break;
      case "documents":
        router.navigate("/documents");
        break;
      case "test":
        router.navigate("/notification-test");
        break;
      default:
        router.navigate("/notifications");
        break;
    }
  }
};

const handleForegroundNotification = (event: NotificationWillDisplayEvent) => {
  debug("Notification received in foreground:", event);
  event.getNotification().display();
};

const handlePushSubscriptionChange = (event: any) => {
  debug("Push Subscription changed:", event);
  debug("New Subscription ID:", event?.current?.id ?? null);
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
    OneSignal.Notifications.removeEventListener(
      "click",
      handleNotificationClick,
    );
    OneSignal.User.pushSubscription.removeEventListener(
      "change",
      handlePushSubscriptionChange,
    );
    decrementOneSignalListeners(3);
  };
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

    if (
      activeOneSignalSyncKey === syncKey ||
      lastOneSignalSyncKey === syncKey
    ) {
      return;
    }

    let cancelled = false;
    activeOneSignalSyncKey = syncKey;

    const handleNotificationState = async () => {
      try {
        if (notificationsEnabled) {
          debug("Notifications enabled — syncing OneSignal...");

          const alreadyGranted =
            await OneSignal.Notifications.getPermissionAsync();

          if (!alreadyGranted) {
            // NEW: Check if we already requested this session
            if (hasRequestedPermissionThisSession) {
              debug("Permission already requested this session, skipping");
              return;
            }

            await waitForStableAppState(2000);

            const canRequest =
              await OneSignal.Notifications.canRequestPermission();

            if (canRequest) {
              hasRequestedPermissionThisSession = true; // NEW: Mark as requested
              const granted =
                await OneSignal.Notifications.requestPermission(true);
              debug("Permission granted:", granted);

              if (!granted) return;
            } else {
              debug(
                "Cannot request permission — user must enable in device settings",
              );
              return;
            }
          }

          if (session?.user?.id) {
            await OneSignal.login(String(session.user.id));
            debug("Logged into OneSignal with user:", session.user.id);

            const subscriptionId =
              await OneSignal.User.pushSubscription.getIdAsync();
            debug("OneSignal Subscription ID:", subscriptionId);
          }

          await OneSignal.User.pushSubscription.optIn();
        } else {
          debug("Notifications disabled — opting out of push...");
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
    debug("Logging into OneSignal with user:", userId);
    await OneSignal.login(userId);

    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();

    debug("User logged in to OneSignal");
    debug("External ID:", userId);
    debug("Subscription ID:", subscriptionId);

    return subscriptionId;
  } catch (err) {
    error("OneSignal login error:", err);
    throw err;
  }
};

export const onLogout = async () => {
  try {
    debug("Logging out from OneSignal");
    await OneSignal.logout();
    debug("Logged out from OneSignal successfully");
  } catch (err) {
    error("OneSignal logout error:", err);
  }
};

export const getSubscriptionId = async (): Promise<string | null> => {
  try {
    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
    return subscriptionId;
  } catch (err) {
    error("Error getting subscription ID:", err);
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
  } catch (err) {
    error("Error checking notification permission:", err);
    return {
      hasPermission: false,
      canRequest: false,
    };
  }
};

export const useOneSignalSubscriptionStatus = () => {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const setNotifications = useSettingsStore((state) => state.setNotifications);
  const hasSyncedSettings = useRef(false); // NEW: prevent multiple settings updates

  const refresh = useCallback(async () => {
    setIsChecking(true);
    initializeOneSignal();

    try {
      const id = await OneSignal.User.pushSubscription.getIdAsync();
      setSubscriptionId(id);

      // Sync settings store when subscription is active — only once
      if (id && !hasSyncedSettings.current) {
        const hasPermission =
          await OneSignal.Notifications.getPermissionAsync();
        if (hasPermission) {
          const currentEnabled =
            useSettingsStore.getState().notificationsEnabled;
          if (!currentEnabled) {
            debug("Auto-enabling notifications in settings store");
            await setNotifications(true);
            hasSyncedSettings.current = true; // NEW
          }
        }
      }
    } catch (err) {
      error("Error checking OneSignal subscription ID:", err);
      setSubscriptionId(null);
    } finally {
      setIsChecking(false);
    }
  }, [setNotifications]);

  useEffect(() => {
    const listener = (event: any) => {
      const newId = event.current?.id ?? null;
      setSubscriptionId(newId);

      // Sync on push subscription change — only once
      if (newId && !hasSyncedSettings.current) {
        const currentEnabled = useSettingsStore.getState().notificationsEnabled;
        if (!currentEnabled) {
          debug(
            "Push subscription acquired — enabling notifications in settings",
          );
          (async () => {
            try {
              setNotifications(true);
              hasSyncedSettings.current = true;
            } catch (err) {
              error("Failed to auto-enable notifications:", err);
            }
          })();
        }
      }
    };

    refresh();
    OneSignal.User.pushSubscription.addEventListener("change", listener);
    incrementOneSignalListeners();

    return () => {
      OneSignal.User.pushSubscription.removeEventListener("change", listener);
      decrementOneSignalListeners();
    };
  }, [refresh, setNotifications]);

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
    // NEW: Check session flag
    if (hasRequestedPermissionThisSession) {
      debug("Already requested permission this session, skipping");
      return null;
    }

    const canRequest = await OneSignal.Notifications.canRequestPermission();
    if (!canRequest) return null;

    hasRequestedPermissionThisSession = true; // NEW
    hasPermission = await OneSignal.Notifications.requestPermission(true);
  }

  if (!hasPermission) return null;

  OneSignal.User.pushSubscription.optIn();

  return waitForSubscriptionId(timeoutMs);
};
