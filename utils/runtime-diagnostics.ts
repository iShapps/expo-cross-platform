import { setTransitionCount } from "./wait-for-stable-app-state";

const rootMountId = `${Date.now().toString(36)}-${Math.random()
  .toString(36)
  .slice(2, 8)}`;

let rootRenderCount = 0;
let appStateTransitionCount = 0;
let activeOneSignalListeners = 0;
let activeAppStateListeners = 0;
let oneSignalInitialized = false;
let bootstrapAlreadyRunning = false;
let bootstrapStartedAt: number | null = null;
let startupStabilized = false;

const providerMountCounts: Record<string, number> = {};
const providerUnmountCounts: Record<string, number> = {};

export const incrementRootRenderCount = () => {
  rootRenderCount += 1;
};

export const incrementProviderMount = (name: string) => {
  providerMountCounts[name] = (providerMountCounts[name] ?? 0) + 1;
};

export const incrementProviderUnmount = (name: string) => {
  providerUnmountCounts[name] = (providerUnmountCounts[name] ?? 0) + 1;
};

export const markOneSignalInitialized = () => {
  oneSignalInitialized = true;
};

export const incrementOneSignalListeners = (count = 1) => {
  activeOneSignalListeners += count;
};

export const decrementOneSignalListeners = (count = 1) => {
  activeOneSignalListeners = Math.max(0, activeOneSignalListeners - count);
};

export const incrementAppStateListeners = () => {
  activeAppStateListeners += 1;
};

export const decrementAppStateListeners = () => {
  activeAppStateListeners = Math.max(0, activeAppStateListeners - 1);
};

export const incrementAppStateTransitionCount = () => {
  appStateTransitionCount += 1;
  // Notify stability tracker that a transition just happened
  setTransitionCount(appStateTransitionCount);
};

export const markBootstrapStarted = () => {
  bootstrapAlreadyRunning = true;
  bootstrapStartedAt = Date.now();
};

export const markBootstrapFinished = () => {
  bootstrapAlreadyRunning = false;
};

export const setStartupStabilized = (value: boolean) => {
  startupStabilized = value;
};

export const getRuntimeDiagnostics = () => ({
  rootMountId,
  rootRenderCount,
  providerMountCounts,
  providerUnmountCounts,
  oneSignalInitialized,
  activeOneSignalListeners,
  activeAppStateListeners,
  bootstrapAlreadyRunning,
  bootstrapStartedAt,
  appStateTransitionCount,
  startupStabilized,
  requestStartedAfterInteractionManager: startupStabilized,
});
