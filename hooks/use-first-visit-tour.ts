import { TourKey, useTourStore } from "@/data-store/use-tour-store";
import { useEffect, useRef } from "react";
import { useCopilot } from "react-native-copilot";

/**
 * Starts this screen's coachmark tour the first time the user lands on it,
 * then marks it seen (so it never shows again) once the tour ends
 */
export function useFirstVisitTour(key: TourKey, ready: boolean) {
  const { start, copilotEvents } = useCopilot();
  const seen = useTourStore((state) => state.seen[key]);
  const hasHydrated = useTourStore((state) => state.hasHydrated);
  const markSeen = useTourStore((state) => state.markSeen);
  const startedRef = useRef(false);
  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => {
    if (seen || !ready) {
      startedRef.current = false;
      return;
    }
    if (!hasHydrated || startedRef.current) return;
    startedRef.current = true;

    // CopilotStep targets need a layout pass to measure before start()
    // can position the spotlight correctly.
    const timer = setTimeout(() => {
      startRef.current();
    }, 500);

    return () => clearTimeout(timer);
  }, [hasHydrated, seen, ready]);

  useEffect(() => {
    const onStop = () => {
      if (startedRef.current) {
        markSeen(key);
      }
    };
    copilotEvents.on("stop", onStop);
    return () => {
      copilotEvents.off("stop", onStop);
    };
  }, [copilotEvents, key, markSeen]);
}
