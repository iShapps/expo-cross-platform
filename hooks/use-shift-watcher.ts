import { useProfileData } from "@/data-store/use-account-store";
import {
    startBackgroundTracking,
    stopBackgroundTracking,
} from "@/task-services/locationTask";
import { useEffect } from "react";

export const useShiftWatcher = () => {
  const acceptedShift = useProfileData((state) => state.acceptedShift);

  useEffect(() => {
    if (!acceptedShift) return;

    const shiftStart = new Date(acceptedShift.start_time).getTime();
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    if (shiftStart - now <= oneHourMs) {
      // Start sending location updates
      startBackgroundTracking();
    }

    // Stop tracking once user starts the shift
    return () => {
      stopBackgroundTracking();
    };
  }, [acceptedShift]);
};
