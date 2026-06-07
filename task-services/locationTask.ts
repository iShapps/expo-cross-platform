import { postShiftLocation } from "@/api-queries/post-pending-shifts";
import { useProfileData } from "@/data-store/use-account-store";
import { debug, error as debugError, warn } from "@/utils/logger";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const LOCATION_TASK_NAME = "background-location-task";
const ONE_HOUR_MS = 60 * 60 * 1000;

// Background Task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    debugError("Background location task error:", error);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  const location = locations[0];

  // Get current accepted shift from storage
  const acceptedShift = useProfileData.getState().acceptedShift;
  if (!acceptedShift) return;

  const shiftStartTime = new Date(acceptedShift.start_time).getTime();
  const shiftEndTime = new Date(acceptedShift.end_time).getTime();
  const now = Date.now();

  if (now > shiftEndTime) {
    await stopBackgroundTracking();
    useProfileData.getState().setAcceptedShift(null);
    debug("[LocationTask] Shift ended — background tracking stopped");
    return;
  }

  // only send location if shift starts within 1 hour
  if (shiftStartTime - now > ONE_HOUR_MS) return;
  debug(
    `[LocationTask] Shift starts in ${Math.round((shiftStartTime - now) / 60_000)} min — sending location update`,
  );

  try {
    debug(
      `[LocationTask] Got location: ${location.coords.latitude}, ${location.coords.longitude}`,
    );
    await postShiftLocation({
      shift_id: acceptedShift.id,
      facility_id: acceptedShift.facility_id,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    debug(
      `[LocationTask] Sent: ${location.coords.latitude}, ${location.coords.longitude}`,
    );
  } catch (err) {
    debugError("[LocationTask] Failed to send location:", err);
  }
});

const isTrackingActive = async (): Promise<boolean> => {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch {
    return false;
  }
};

// Start Background Tracking
export const startBackgroundTracking = async (): Promise<boolean> => {
  debug("[LocationTask] Attempting to start background tracking...");
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== "granted") {
    warn("[LocationTask] Foreground permission denied");
    return false;
  }

  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== "granted") {
    warn("[LocationTask] Background permission denied");
    return false;
  }

  const alreadyRunning = await isTrackingActive();
  if (alreadyRunning) {
    debug("[LocationTask] Background tracking already active");
    return true;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 600_000, // 10 minutes
    distanceInterval: 100, // minimum 100 m between updates
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true, // iOS indicator
    foregroundService: {
      // Android: required for background service
      notificationTitle: "Location Tracking",
      notificationBody:
        "Your location is being tracked in the background to help us have your current location as you head to the facility.",
      notificationColor: "#70C601",
    },
  });

  debug("[LocationTask] Background tracking started");
  return true;
};

// Stop Background Tracking
export const stopBackgroundTracking = async (): Promise<void> => {
  const running = await isTrackingActive();
  if (running) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    debug("[LocationTask] Background tracking stopped");
  }
};

export { ONE_HOUR_MS };
