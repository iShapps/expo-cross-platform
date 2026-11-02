import { Redirect } from "expo-router";

/**
 * Contracts and policies moved into Documents (Certifications | Contracts |
 * Policies). Kept so older links and notifications still land there.
 */
export default function AgreementsScreen() {
  return <Redirect href={{ pathname: "/(tabs)/documents", params: { tab: "agreements" } }} />;
}
