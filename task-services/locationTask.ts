import { postShiftLocation } from "@/api-queries/post-pending-shifts";
import { useProfileData } from "@/data-store/use-account-store";
import { debug, error as debugError, warn } from "@/utils/logger";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const LOCATION_TASK_NAME = "background-location-task";
const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_MIN_MS = 30 * 60 * 1000;
const ONE_MIN_MS = 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;
const MIN_DISTANCE_METERS = 100;

function resolveTrackingInterval(timeUntilStartMs: number): number {
  if (timeUntilStartMs <= THIRTY_MIN_MS) return ONE_MIN_MS;
  return FIVE_MIN_MS;
}

function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const EARTH_RADIUS_M = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function trackingOptions(timeInterval: number): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.Balanced,
    timeInterval,
    distanceInterval: MIN_DISTANCE_METERS,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Location Tracking",
      notificationBody:
        "Your location is being tracked in the background to help us have your current location as you head to the facility.",
      notificationColor: "#70C601",
    },
  };
}

// Background Task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    debugError("Background location task error:", error);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  // Locations arrive chronologically ordered — the last one is the freshest.
  const location = locations[locations.length - 1];

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

  const timeUntilStart = shiftStartTime - now;
  debug(
    `[LocationTask] Shift starts in ${Math.round(timeUntilStart / 60_000)} min`,
  );

  const desiredInterval = resolveTrackingInterval(timeUntilStart);
  const { activeTrackingIntervalMs, setActiveTrackingIntervalMs } =
    useProfileData.getState();
  if (activeTrackingIntervalMs !== desiredInterval) {
    try {
      await Location.startLocationUpdatesAsync(
        LOCATION_TASK_NAME,
        trackingOptions(desiredInterval),
      );
      setActiveTrackingIntervalMs(desiredInterval);
      debug(
        `[LocationTask] Update interval set to ${desiredInterval / 60_000} min`,
      );
    } catch (err) {
      debugError("[LocationTask] Failed to reconfigure update interval:", err);
    }
  }

  const { lastLocationUpdate, setLastLocationUpdate } =
    useProfileData.getState();
  if (lastLocationUpdate) {
    const moved = distanceMeters(lastLocationUpdate, location.coords);
    if (moved < MIN_DISTANCE_METERS) {
      debug(
        `[LocationTask] Moved ${moved.toFixed(
          0,
        )}m since last update — skipping (< ${MIN_DISTANCE_METERS}m)`,
      );
      return;
    }
  }

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
    setLastLocationUpdate({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      sentAt: now,
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

  await Location.startLocationUpdatesAsync(
    LOCATION_TASK_NAME,
    trackingOptions(FIVE_MIN_MS),
  );
  useProfileData.getState().setActiveTrackingIntervalMs(FIVE_MIN_MS);

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
