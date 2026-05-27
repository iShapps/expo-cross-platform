import { useProfileData } from "@/data-store/use-account-store";
import {
  ONE_HOUR_MS,
  startBackgroundTracking,
  stopBackgroundTracking,
} from "@/task-services/locationTask";
import { useEffect, useRef } from "react";

export const useShiftWatcher = () => {
  const acceptedShift = useProfileData((state) => state.acceptedShift);
  const userDetails = useProfileData((state) => state.userDetails);
  const token = useProfileData((state) => state.token);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackingStartedRef = useRef(false);

  useEffect(() => {
    console.log("[ShiftWatcher] started");
    // console.log("[ShiftWatcher] accepted shift", acceptedShift);
    // Clear any pending scheduled start from a previous render
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!token || !userDetails?.id || !acceptedShift) {
      console.log("[ShiftWatcher] No shift to track");
      if (trackingStartedRef.current) {
        stopBackgroundTracking();
        trackingStartedRef.current = false;
      }
      return;
    }
    console.log("[ShiftWatcher] Shift found");

    const shiftStart = new Date(acceptedShift.start_time).getTime();
    const now = Date.now();
    const msUntilWindow = shiftStart - now - ONE_HOUR_MS;

    const shiftEnd = new Date(acceptedShift.end_time).getTime();
    if (now > shiftEnd) {
      console.warn(
        "[ShiftWatcher] Shift has already ended — skipping tracking",
      );
      return;
    }

    if (msUntilWindow <= 0) {
      // Shift starts within the hour or has already started
      console.log(
        `[ShiftWatcher] Shift starts in ${Math.round(msUntilWindow / 60_000)} min — starting tracking now`,
      );
      startBackgroundTracking().then((started) => {
        if (started) trackingStartedRef.current = true;
      });
    } else {
      // Shift is more than 1 hour away --- schedule tracking to begin later
      console.log(
        `[ShiftWatcher] Shift starts in ${Math.round(msUntilWindow / 60_000)} min — scheduling tracking`,
      );

      timerRef.current = setTimeout(() => {
        startBackgroundTracking().then((started) => {
          if (started) trackingStartedRef.current = true; // was missing
        });
        timerRef.current = null;
      }, msUntilWindow);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // stopBackgroundTracking();
    };
  }, [acceptedShift, token, userDetails?.id]);
};
