import { postShiftLocation } from "@/api-queries/post-pending-shifts";
import { useProfileData } from "@/data-store/use-account-store";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const LOCATION_TASK_NAME = "background-location-task";

// Background Task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }

  if (!data) return;

  const { locations } = data as any;
  if (!locations || locations.length === 0) return;

  const location = locations[0];

  // Get current accepted shift from storage
  const acceptedShift = useProfileData.getState().acceptedShift;

  if (!acceptedShift) return; // no active shift

  const shiftStartTime = new Date(acceptedShift.start_time).getTime();
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;

  // Only send location if shift starts in <= 1 hour
  if (shiftStartTime - now > oneHourMs) return;

  try {
    await postShiftLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    console.log(
      `Background location sent: ${location.coords.latitude}, ${location.coords.longitude}`,
    );
  } catch (err) {
    console.error("Failed to send background location", err);
  }
});

// Start Background Tracking
export const startBackgroundTracking = async () => {
  // Request permissions
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== "granted") {
    console.warn("Foreground location permission denied");
    return false;
  }

  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== "granted") {
    console.warn("Background location permission denied");
    return false;
  }

  const isRegistered =
    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 600000, // 10 minutes in ms
      distanceInterval: 100, // minimum 100 meters between updates
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true, // iOS
      foregroundService: {
        // Android requirement for background service
        notificationTitle: "iShapps Shift Tracking",
        notificationBody:
          "Your location is being tracked for active shift verification.",
        notificationColor: "#70C601",
      },
    });
    console.log("Background location tracking started");
  }

  return true;
};

// Stop Background Tracking
export const stopBackgroundTracking = async () => {
  const isRegistered =
    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log("Background location tracking stopped");
  }
};
