import Constants from "expo-constants";
import { useEffect } from "react";
import {
    LogLevel,
    NotificationClickEvent,
    NotificationWillDisplayEvent,
    OneSignal,
} from "react-native-onesignal";

// export const useOneSignal = () => {
//   useEffect(() => {
//     const appId = Constants.expoConfig?.extra?.oneSignalAppId;

//     if (!appId) {
//       console.warn("OneSignal App ID is missing in app.json extra config");
//       return;
//     }

//     // Enable logging (remove or reduce in production)
//     OneSignal.Debug.setLogLevel(LogLevel.Verbose);

//     // Initialize OneSignal
//     OneSignal.initialize(appId);

//     // Request permission (recommended only during development)
//     // OneSignal.Notifications.requestPermission(false);
//   }, []);
// };

export const useOneSignal = () => {
  useEffect(() => {
    const appId = Constants.expoConfig?.extra?.oneSignalAppId;
    if (!appId) {
      console.warn("OneSignal App ID is missing in app.json extra config");
      return;
    }

    // Enable logging (remove or reduce in production)
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize(appId);
    OneSignal.Notifications.requestPermission(true);

    // Request permission (recommended only during development)
    // OneSignal.Notifications.requestPermission(false);
    OneSignal.Notifications.canRequestPermission().then((canRequest) => {
      if (canRequest) {
        OneSignal.Notifications.requestPermission(true);
      }
    });

    OneSignal.Notifications.getPermissionAsync().then((status) => {
      console.log("OneSignal permission status:", status);
    });

    OneSignal.Notifications.addEventListener(
      "permissionChange",
      (status: any) => {
        console.log("OneSignal permission changed:", status);
      },
    );

    const handleClick = (event: NotificationClickEvent) => {
      console.log("Notification clicked:", event);
    };

    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event: NotificationWillDisplayEvent) => {
        event.preventDefault(); // Prevent the default notification display
        console.log("Notification received in foreground:", event);
        // event.getNotification().display(); // Manually display the notification if desired
        // event.notification
      },
    );
    OneSignal.Notifications.addEventListener("click", handleClick);

    return () => {
      OneSignal.Notifications.removeEventListener("click", handleClick);
    };
  }, []);
};

// import { OneSignal } from "react-native-onesignal";

// const onLoginSuccess = (user: { id: number }) => {
//   OneSignal.login(user.id.toString());
// };
