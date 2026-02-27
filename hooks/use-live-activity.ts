import { IShift } from "@/data-types/shifts";
import { buildVariants } from "@/utils/live-activity-variants";
import { useCallback, useEffect, useRef } from "react";
import { startLiveActivity, updateLiveActivity } from "voltra/client";

export function useLiveActivity() {
  console.log("useLiveActivity called");
  const activityIdRef = useRef<string | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    activityIdRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(
    async (shift: IShift) => {
      console.log("Starting live activity for shift:", shift);
      if (!shift) return;
      console.log(
        "Shift start time:",
        shift.start_time,
        "end time:",
        shift.end_time,
      );
      try {
        const now = new Date();
        const activityId = await startLiveActivity(buildVariants(shift, now));
        activityIdRef.current = activityId;

        updateIntervalRef.current = setInterval(async () => {
          const tick = new Date();
          const id = activityIdRef.current;
          if (!id) return;

          try {
            await updateLiveActivity(id, buildVariants(shift, tick));
          } catch (err) {
            console.warn("updateLiveActivity failed:", err);
            stop();
            return;
          }

          if (tick.getTime() >= new Date(shift.end_time).getTime()) {
            stop();
          }
        }, 1000);
      } catch (err) {
        console.warn("Failed to start live activity:", err);
        throw err;
      }
    },
    [stop],
  );

  return { start, stop };
}
