import Constants from "expo-constants";
import { useEffect } from "react";
import {
  LogLevel,
  NotificationClickEvent,
  NotificationWillDisplayEvent,
  OneSignal,
} from "react-native-onesignal";

export const useOneSignal = () => {
  useEffect(() => {
    const appId = Constants.expoConfig?.extra?.oneSignalAppId;

    if (!appId) {
      console.warn("OneSignal App ID is missing in app.json extra config");
      return;
    }

    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }

    OneSignal.initialize(appId);

    const requestPermission = async () => {
      const canRequest = await OneSignal.Notifications.canRequestPermission();

      if (canRequest) {
        await OneSignal.Notifications.requestPermission(true);
      }

      const permission = await OneSignal.Notifications.getPermissionAsync();

      console.log("OneSignal permission status:", permission);
    };

    requestPermission();

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
