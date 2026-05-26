import { useSession } from "@/app/ctx";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { AppNotification } from "@/data-types/notifications";
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
let oneSignalListenersRegistered = false;

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
    console.log("OneSignal initialized");
  }

  if (!oneSignalListenersRegistered) {
    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      handleForegroundNotification,
    );
    OneSignal.Notifications.addEventListener(
      "click",
      handleNotificationClick,
    );
    OneSignal.User.pushSubscription.addEventListener(
      "change",
      handlePushSubscriptionChange,
    );
    oneSignalListenersRegistered = true;
  }

  return true;
};

const handleNotificationClick = (event: NotificationClickEvent) => {
  console.log("Notification clicked:", event);
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
  console.log("Notification received in foreground:", event);
  event.getNotification().display();
};

const handlePushSubscriptionChange = (event: any) => {
  console.log("Push Subscription changed:", event);
  console.log("New Subscription ID:", event.current?.id);
};

export const useOneSignal = () => {
  const notificationsEnabled = useSettingsStore(
    (state) => state.notificationsEnabled,
  );
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);
  const session = useSession();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(initializeOneSignal());
  }, []);

  useEffect(() => {
    if (!oneSignalInitialized || !hasHydrated) return;

    const handleNotificationState = async () => {
      if (notificationsEnabled) {
        console.log("Notifications enabled — syncing OneSignal...");

        const alreadyGranted =
          await OneSignal.Notifications.getPermissionAsync();

        if (!alreadyGranted) {
          const canRequest =
            await OneSignal.Notifications.canRequestPermission();

          if (canRequest) {
            const granted =
              await OneSignal.Notifications.requestPermission(true);
            console.log("Permission granted:", granted);

            if (!granted) return;
          } else {
            console.log(
              "Cannot request permission — user must enable in device settings",
            );
            return;
          }
        }

        if (session?.user?.id) {
          await OneSignal.login(String(session.user.id));
          console.log("Logged into OneSignal with user:", session.user.id);

          const subscriptionId =
            await OneSignal.User.pushSubscription.getIdAsync();
          console.log("OneSignal Subscription ID:", subscriptionId);
        }

        await OneSignal.User.pushSubscription.optIn();
      } else {
        console.log("Notifications disabled — opting out of push...");
        await OneSignal.User.pushSubscription.optOut();
      }
    };

    handleNotificationState();
  }, [hasHydrated, notificationsEnabled, session?.user?.id]);

  return {
    isInitialized: initialized,
  };
};

export const onLoginSuccess = async (userId: string) => {
  try {
    console.log("Logging into OneSignal with user:", userId);
    await OneSignal.login(userId);

    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();

    console.log("User logged in to OneSignal");
    console.log("External ID:", userId);
    console.log("Subscription ID:", subscriptionId);

    return subscriptionId;
  } catch (error) {
    console.error("OneSignal login error:", error);
    throw error;
  }
};

export const onLogout = async () => {
  try {
    console.log("Logging out from OneSignal");
    await OneSignal.logout();
    console.log("Logged out from OneSignal successfully");
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

    return () => {
      OneSignal.User.pushSubscription.removeEventListener("change", listener);
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
      resolve(null);
    }, timeoutMs);

    const listener = (event: any) => {
      const id = event.current?.id;

      if (id) {
        clearTimeout(timeout);
        OneSignal.User.pushSubscription.removeEventListener("change", listener);
        resolve(id);
      }
    };

    OneSignal.User.pushSubscription.addEventListener("change", listener);
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
