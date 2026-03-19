import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useSession } from "./ctx";

export function SplashScreenController({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useSession();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!isLoading) setAppReady(true);
  }, [isLoading]);

  const onLayout = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {children}
    </View>
  );
}
