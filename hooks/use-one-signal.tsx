import { useSession } from "@/app/ctx";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { AppNotification } from "@/data-types/notifications";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  LogLevel,
  NotificationClickEvent,
  NotificationWillDisplayEvent,
  OneSignal,
} from "react-native-onesignal";

export const useOneSignal = () => {
  const notificationsEnabled = useSettingsStore(
    (state) => state.notificationsEnabled,
  );
  const session = useSession();
  const isInitialized = useRef(false);

  useEffect(() => {
    const appId = Constants.expoConfig?.extra?.eas?.oneSignalAppId;

    if (!appId) {
      console.warn("OneSignal App ID is missing in app.json extra config");
      return;
    }

    if (isInitialized.current) return;

    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }

    OneSignal.initialize(appId);
    isInitialized.current = true;

    console.log("OneSignal initialized");

    const handleClick = (event: NotificationClickEvent) => {
      console.log("Notification clicked:", event);
      const notification = extractNotification(event);
      console.log("Extracted notification data:", notification);

      // redirect based on notification type
      if (notification && notification.additionalData) {
        // navigate to shift details page
        switch (notification.additionalData.notification_type) {
          case "shifts":
            router.navigate(
              `/${notification.additionalData.shift_id.toString()}`,
            );
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

    const handleForeground = (event: NotificationWillDisplayEvent) => {
      console.log("Notification received in foreground:", event);
      event.getNotification().display();
    };

    const subscriptionListener = (event: any) => {
      console.log("Push Subscription changed:", event);
      console.log("New Subscription ID:", event.current?.id);
    };

    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      handleForeground,
    );
    OneSignal.Notifications.addEventListener("click", handleClick);
    OneSignal.User.pushSubscription.addEventListener(
      "change",
      subscriptionListener,
    );

    return () => {
      OneSignal.Notifications.removeEventListener(
        "foregroundWillDisplay",
        handleForeground,
      );
      OneSignal.Notifications.removeEventListener("click", handleClick);
      OneSignal.User.pushSubscription.removeEventListener(
        "change",
        subscriptionListener,
      );
    };
  }, []);

  // notification state changes
  useEffect(() => {
    if (!isInitialized.current) return;

    const handleNotificationState = async () => {
      console.log("Notification state changed:", {
        enabled: notificationsEnabled,
        userId: session?.user?.id,
      });

      if (notificationsEnabled) {
        console.log("Enabling notifications...");

        const canRequest = await OneSignal.Notifications.canRequestPermission();

        if (canRequest) {
          const granted = await OneSignal.Notifications.requestPermission(true);
          console.log("Permission granted:", granted);
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
        console.log("Disabling notifications...");

        await OneSignal.User.pushSubscription.optOut();

        if (session?.user?.id) {
          await OneSignal.logout();
          console.log("Logged out from OneSignal");
        }
      }
    };

    handleNotificationState();
  }, [notificationsEnabled, session?.user?.id]);

  return {
    isInitialized: isInitialized.current,
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

const extractNotification = (
  event: NotificationClickEvent | NotificationWillDisplayEvent,
): AppNotification => {
  return event.notification as AppNotification;
};
