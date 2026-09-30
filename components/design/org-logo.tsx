import { FontFamily } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useState } from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  name?: string | null;
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function initials(name?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/**
 * An organisation's logo in a rounded tile. Falls back to the organisation's
 * initials when there's no logo URL or the image can't be loaded.
 */
export function OrgLogo({ name, uri, size = 64, style }: Props) {
  const { colors } = useAppTheme();
  // Remember which URL failed, so a new one (e.g. refreshed on launch) gets a fresh attempt.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = !!uri && failedUri !== uri;
  const radius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: showImage ? "#FFFFFF" : colors.primary,
          borderColor: showImage ? colors.border : colors.primary,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          resizeMode="contain"
          accessibilityLabel={name ?? "Organisation logo"}
          style={{ width: size * 0.78, height: size * 0.78 }}
          onError={() => setFailedUri(uri!)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.36, color: colors.textOnPrimary }]}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontFamily: FontFamily.bold,
  },
});
