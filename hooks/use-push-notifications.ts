import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

// Configure how notifications are displayed when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function handleRegistrationError(errorMessage: string) {
  Alert.alert("Push Notification Error", errorMessage);
  console.error(errorMessage);
}

/**
 * Register device for push notifications and get Expo push token
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    handleRegistrationError("Must use physical device for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    handleRegistrationError("Permission not granted for push notifications!");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    handleRegistrationError("Project ID not found in Expo config");
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    return token;
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
    return null;
  }
}

/**
 * Custom hook for push notifications
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  useEffect(() => {
    // Register device and get token
    registerForPushNotificationsAsync()
      .then((token) => token && setExpoPushToken(token))
      .catch((error) => console.error(error));

    // Listeners
    const notificationListener =
      Notifications.addNotificationReceivedListener(setNotification);
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("User interacted with notification:", response);
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return { expoPushToken, notification };
}
