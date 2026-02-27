import { IShift } from "@/data-types/shifts";
import { buildVariants } from "@/utils/live-activity-variants";
import { useCallback, useEffect, useRef } from "react";
import { startLiveActivity, updateLiveActivity } from "voltra/client";

const activeActivities = new Map<string, string>();

export function useLiveActivity() {
  const activityIdRef = useRef<string | null>(null);
  const currentShiftIdRef = useRef<string | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const stop = useCallback(async () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    if (currentShiftIdRef.current) {
      activeActivities.delete(currentShiftIdRef.current);
    }

    activityIdRef.current = null;
    currentShiftIdRef.current = null;
    isStartingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const start = useCallback(
    async (shift: IShift) => {
      if (!shift?.id) {
        console.warn("No valid shift provided");
        return;
      }

      const shiftId = shift.id.toString();

      // Prevent duplicate starts
      if (isStartingRef.current) {
        console.log("Already starting a live activity");
        return;
      }

      // Check if activity already exists for this shift
      const existingActivityId = activeActivities.get(shiftId);
      if (existingActivityId) {
        console.log("Live activity already exists for this shift:", shiftId);
        activityIdRef.current = existingActivityId;
        currentShiftIdRef.current = shiftId;
        return;
      }

      // Check if currently running activity is for the same shift
      if (activityIdRef.current && currentShiftIdRef.current === shiftId) {
        console.log("Live activity already running for this shift");
        return;
      }

      // Stop any existing activity for different shift
      if (activityIdRef.current && currentShiftIdRef.current !== shiftId) {
        console.log("Stopping previous live activity");
        await stop();
      }

      isStartingRef.current = true;

      try {
        const now = new Date();
        const shiftEnd = new Date(shift.end_time);

        // Don't start if shift already ended
        if (now.getTime() >= shiftEnd.getTime()) {
          console.log("Shift already ended, not starting live activity");
          isStartingRef.current = false;
          return;
        }

        console.log("Starting new live activity for shift:", shiftId);
        const activityId = await startLiveActivity(buildVariants(shift, now));

        activityIdRef.current = activityId;
        currentShiftIdRef.current = shiftId;
        activeActivities.set(shiftId, activityId);

        updateIntervalRef.current = setInterval(async () => {
          const tick = new Date();
          const id = activityIdRef.current;

          if (!id) {
            clearInterval(updateIntervalRef.current!);
            return;
          }

          // Check if shift ended
          if (tick.getTime() >= shiftEnd.getTime()) {
            console.log("Shift ended, stopping live activity");
            await stop();
            return;
          }

          try {
            await updateLiveActivity(id, buildVariants(shift, tick));
          } catch (err) {
            console.warn("updateLiveActivity failed:", err);
          }
        }, 1000);

        isStartingRef.current = false;
      } catch (err) {
        console.error("Failed to start live activity:", err);
        isStartingRef.current = false;

        // Clean up on error
        if (currentShiftIdRef.current) {
          activeActivities.delete(currentShiftIdRef.current);
        }
        activityIdRef.current = null;
        currentShiftIdRef.current = null;

        throw err;
      }
    },
    [stop],
  );

  return {
    start,
    stop,
    isActive: () => activityIdRef.current !== null,
  };
}
