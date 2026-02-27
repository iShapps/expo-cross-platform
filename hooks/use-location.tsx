import { useSettingsStore } from "@/data-store/use-settings-store";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

export function useLocation() {
  const locationEnabled = useSettingsStore((state) => state.locationEnabled);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);

  const [loading, setLoading] = useState(false);

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    setPermissionStatus(status);

    if (status !== "granted") {
      setErrorMsg("Permission denied");
      return false;
    }

    return true;
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);

    try {
      const granted =
        permissionStatus === "granted" ? true : await requestPermission();

      if (!granted) return null;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
      return currentLocation;
    } catch (err) {
      setErrorMsg("Failed to fetch location");
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissionStatus, requestPermission]);

  const startTracking = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;

    if (watchSubscription.current) return;

    watchSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
      },
      (newLocation) => {
        setLocation(newLocation);
      },
    );
  }, [requestPermission]);

  const stopTracking = useCallback(() => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
  }, []);

  useEffect(() => {
    if (locationEnabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [locationEnabled, startTracking, stopTracking]);

  return {
    location,
    errorMsg,
    loading,
    permissionStatus,
    requestPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
  };
}
