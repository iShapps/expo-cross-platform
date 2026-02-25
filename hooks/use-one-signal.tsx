import { useSession } from "@/app/ctx";
import { useSettingsStore } from "@/data-store/use-settings-store";
import Constants from "expo-constants";
import { useEffect } from "react";
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
  useEffect(() => {
    const appId = Constants.expoConfig?.extra?.eas?.oneSignalAppId;

    if (!appId) {
      console.warn("OneSignal App ID is missing in app.json extra config");
      return;
    }

    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }

    OneSignal.initialize(appId);
    const handleNotificationState = async () => {
      console.log("Notifications called");
      if (notificationsEnabled) {
        console.log("Notifications ENABLED");
        const canRequest = await OneSignal.Notifications.canRequestPermission();

        if (canRequest) {
          await OneSignal.Notifications.requestPermission(true);
        }

        if (session?.user?.id) {
          await OneSignal.login(String(session.user.id));
          console.log("Logged into OneSignal");
        }
      } else {
        console.log("Notifications DISABLED");
        await OneSignal.logout();
      }
    };

    handleNotificationState();

    const logSubscription = async () => {
      const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();

      console.log("OneSignal Subscription ID:", subscriptionId);
    };

    logSubscription();

    const subscriptionListener = (event: any) => {
      console.log("Push Subscription changed:", event);
      console.log("New Subscription ID:", event.current?.id);
    };

    OneSignal.User.pushSubscription.addEventListener(
      "change",
      subscriptionListener,
    );

    const handleClick = (event: NotificationClickEvent) => {
      console.log("Notification clicked:", event);
    };

    const handleForeground = (event: NotificationWillDisplayEvent) => {
      console.log("Notification received in foreground:", event);

      event.getNotification().display();
    };

    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      handleForeground,
    );

    OneSignal.Notifications.addEventListener("click", handleClick);

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
};

export const onLoginSuccess = async (user: string) => {
  try {
    await OneSignal.login(user);

    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();

    console.log("User logged in to OneSignal");
    console.log("External ID:", user);
    console.log("Subscription ID:", subscriptionId);
  } catch (error) {
    console.error("OneSignal login error:", error);
  }
};

export const onLogout = async () => {
  await OneSignal.logout();
};
