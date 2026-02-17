import * as Location from "expo-location";
import { useCallback, useState } from "react";

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Request Permission
  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);

    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
      return false;
    }

    return true;
  }, []);

  // Get Current Location
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
    } catch (error) {
      setErrorMsg("Failed to fetch location");
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissionStatus, requestPermission]);

  return {
    location,
    errorMsg,
    loading,
    permissionStatus,
    requestPermission,
    getCurrentLocation,
  };
}
