import { QueryClient } from "@tanstack/react-query";

// Single shared instance: the QueryClientProvider in app/_layout.tsx renders
// with this, and code outside the component tree (e.g. the OneSignal click
// handler, registered once at module scope) can import it directly to
// read/invalidate cached data without needing a hook.
export const queryClient = new QueryClient();
