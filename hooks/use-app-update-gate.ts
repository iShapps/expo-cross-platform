import { getGeneralAppConfigs } from "@/api-queries/configs";
import { useConfigSettings } from "@/data-store/config-store";
import { IConfigResponse } from "@/data-types/config";
import { useQuery } from "@tanstack/react-query";
import * as Application from "expo-application";
import { useEffect } from "react";
import { Linking, Platform } from "react-native";

const normalizeVersionPart = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const compareVersions = (currentVersion: string, requiredVersion: string) => {
  const currentParts = currentVersion.split(".").map(normalizeVersionPart);
  const requiredParts = requiredVersion.split(".").map(normalizeVersionPart);
  const maxLength = Math.max(currentParts.length, requiredParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const current = currentParts[index] ?? 0;
    const required = requiredParts[index] ?? 0;

    if (current < required) return -1;
    if (current > required) return 1;
  }

  return 0;
};

export const useAppUpdateGate = () => {
  const storedConfigSettings = useConfigSettings(
    (state) => state.configSettings,
  );
  const setConfigSettings = useConfigSettings(
    (state) => state.setConfigSettings,
  );

  const { data: configResponse } = useQuery<IConfigResponse>({
    queryKey: ["config-settings"],
    queryFn: () => getGeneralAppConfigs(),
    gcTime: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 60 * 24,
    refetchInterval: 1000 * 60 * 60 * 24,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!configResponse?.data) return;
    setConfigSettings(configResponse.data);
  }, [configResponse, setConfigSettings]);

  const configSettings = configResponse?.data ?? storedConfigSettings;
  const installedAppVersion = Application.nativeApplicationVersion ?? "0.0.0";
  const requiredAppVersion =
    Platform.OS === "ios"
      ? configSettings?.configuration?.ios_app_version
      : configSettings?.configuration?.android_app_version;
  const storeLink =
    Platform.OS === "ios"
      ? configSettings?.configuration?.ios_app_link
      : configSettings?.configuration?.android_app_link;
  const isUpdateRequired =
    !!requiredAppVersion &&
    compareVersions(installedAppVersion, requiredAppVersion) !== 0;

  const openStore = async () => {
    if (!storeLink) return;

    const supported = await Linking.canOpenURL(storeLink);
    if (supported) {
      await Linking.openURL(storeLink);
    }
  };

  return {
    installedAppVersion,
    isUpdateRequired,
    openStore,
    requiredAppVersion,
    storeLink,
  };
};
