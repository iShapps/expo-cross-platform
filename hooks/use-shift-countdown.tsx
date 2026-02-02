import { getShiftCountdown } from "@/utils/shifts";
import { useEffect, useState } from "react";

export function useShiftCountdown(periodStart: string, periodEnd: string) {
  const [countdown, setCountdown] = useState(() =>
    getShiftCountdown(periodStart, periodEnd),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getShiftCountdown(periodStart, periodEnd));
    }, 1000);

    return () => clearInterval(interval);
  }, [periodStart, periodEnd]);

  return countdown;
}
