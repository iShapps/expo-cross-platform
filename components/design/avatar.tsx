import { FontFamily, Radius } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useState } from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  name?: string | null;
  uri?: string | null;
  size?: number;
  /** White ring, for use on the green hero. */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
};

function initials(name?: string | null) {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Round avatar; falls back to initials when there's no image or it fails to load. */
export function Avatar({ name, uri, size = 48, ring = false, style }: Props) {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor: colors.primarySoft,
          borderWidth: ring ? 2 : 0,
          borderColor: ring ? colors.heroGlassBorder : "transparent",
        },
        style,
      ]}
    >
      {showImage ? (
        <Image source={{ uri: uri! }} style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      ) : (
        <Text style={{ fontFamily: FontFamily.semibold, fontSize: size * 0.36, color: colors.primaryStrong }}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
