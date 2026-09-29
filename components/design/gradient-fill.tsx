import { useId, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type Props = {
  /** Two or more colours, evenly spaced unless `locations` is given. */
  colors: readonly string[];
  /** Stop positions (0–1), one per colour. */
  locations?: readonly number[];
  /** Diagonal (web's 135deg) by default; "vertical" runs top → bottom. */
  direction?: "diagonal" | "vertical";
  /** Solid first colour under the gradient; turn off for translucent overlays. */
  underlay?: boolean;
};

/**
 * react-native-svg drops the alpha of an `rgba()` stopColor (the stop comes
 * out opaque), so split it into an opaque colour plus stopOpacity.
 */
function splitAlpha(color: string): { rgb: string; alpha: number } {
  const match = color.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
  if (!match) return { rgb: color, alpha: 1 };
  const [, r, g, b, a] = match;
  return { rgb: `rgb(${r},${g},${b})`, alpha: Number(a) };
}

/**
 * Fills its parent with a linear gradient. Put it first inside a view with
 * `overflow: "hidden"` (and the view's borderRadius) — it's absolutely
 * positioned and doesn't take touches.
 *
 * The SVG gets explicit pixel dimensions from onLayout: a percentage-sized
 * SVG keeps the size of its first layout pass and leaves the rest of a
 * parent that grows afterwards unpainted. The solid colour underneath covers
 * the frame before measurement.
 */
export function GradientFill({ colors, locations, direction = "diagonal", underlay = true }: Props) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const end = direction === "diagonal" ? { x2: "1", y2: "1" } : { x2: "0", y2: "1" };
  const offset = (i: number) => locations?.[i] ?? (colors.length > 1 ? i / (colors.length - 1) : 0);

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, underlay && { backgroundColor: colors[0] }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.width || height !== size.height) setSize({ width, height });
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" {...end}>
              {colors.map((color, i) => {
                const { rgb, alpha } = splitAlpha(color);
                return <Stop key={i} offset={String(offset(i))} stopColor={rgb} stopOpacity={alpha} />;
              })}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
}
