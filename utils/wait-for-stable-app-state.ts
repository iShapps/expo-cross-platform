import { AppState, AppStateStatus, Platform } from "react-native";

type AppStateSubscription = {
  remove: () => void;
};

let transitionCountAtLastCheck = 0;
let lastTransitionCheckTime = 0;

export function setTransitionCount(count: number): void {
  transitionCountAtLastCheck = count;
  lastTransitionCheckTime = Date.now();
}

export function getLastTransitionCount(): number {
  return transitionCountAtLastCheck;
}

export function getTimeSinceLastTransition(): number {
  return Date.now() - lastTransitionCheckTime;
}

export function waitForStableAppState(delayMs = 500): Promise<void> {
  if (Platform.OS !== "android") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let stabilizeTimer: ReturnType<typeof setTimeout> | undefined;
    let subscription: AppStateSubscription | undefined;
    let resolved = false;
    let consecutiveStableChecks = 0;
    const requiredStableChecks = 3; // Require 3 consecutive checks with no transitions

    const cleanup = () => {
      if (stabilizeTimer) {
        clearTimeout(stabilizeTimer);
      }
      subscription?.remove();
    };

    const resolveOnce = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve();
    };

    const checkStability = () => {
      if (AppState.currentState !== "active") {
        consecutiveStableChecks = 0;
        if (stabilizeTimer) clearTimeout(stabilizeTimer);
        stabilizeTimer = setTimeout(checkStability, 100);
        return;
      }

      // Check if transitions have stopped since last check
      // If the transition count hasn't changed, we're stable
      const timeSinceLastTransition = getTimeSinceLastTransition();
      if (timeSinceLastTransition > delayMs) {
        consecutiveStableChecks++;
        if (consecutiveStableChecks >= requiredStableChecks) {
          resolveOnce();
          return;
        }
      } else {
        // Reset if we detect a new transition
        consecutiveStableChecks = 0;
      }

      if (stabilizeTimer) clearTimeout(stabilizeTimer);
      stabilizeTimer = setTimeout(checkStability, 300);
    };

    const scheduleIfActive = (state: AppStateStatus) => {
      if (state === "active") {
        // Initial active state detected, start checking stability
        if (stabilizeTimer) clearTimeout(stabilizeTimer);
        stabilizeTimer = setTimeout(checkStability, delayMs);
      } else {
        // App went to background, reset
        consecutiveStableChecks = 0;
        if (stabilizeTimer) clearTimeout(stabilizeTimer);
      }
    };

    subscription = AppState.addEventListener("change", scheduleIfActive);
    scheduleIfActive(AppState.currentState);
  });
}
