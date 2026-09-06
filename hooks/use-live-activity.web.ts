import { IShift } from "@/data-types/shifts";

// Live Activities are iOS-only; voltra's native view isn't web-compatible,
// so this stub keeps web/server bundling from pulling in "voltra/client".
export function useLiveActivity() {
  return {
    start: async (_shift: IShift) => {},
    stop: async () => {},
    isActive: () => false,
  };
}
