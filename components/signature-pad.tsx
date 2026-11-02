import { AppText } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import React, { useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, PanResponder, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type Stroke = [number, number][];

type Props = {
  onChange: (strokes: Stroke[], pad: { width: number; height: number }) => void;
  /** Drawing started / ended: lets a scrolling parent pause scrolling. */
  onDrawing?: (drawing: boolean) => void;
  height?: number;
};

const toPath = (stroke: Stroke) =>
  stroke.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
  (stroke.length === 1 ? " l0.1 0.1" : "");

/**
 * Draw-with-your-finger signature. Reports the strokes as points in the pad's
 * own coordinates; the server turns them into the signature image, so no
 * drawing markup ever leaves the phone.
 */
export function SignaturePad({ onChange, onDrawing, height = 180 }: Props) {
  const { colors } = useAppTheme();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const size = useRef({ width: 0, height });
  const current = useRef<Stroke | null>(null);
  // Mirrors the state, for the gesture handlers (created once).
  const strokesRef = useRef<Stroke[]>([]);
  const pad = () => ({ width: Math.round(size.current.width), height: Math.round(size.current.height) });
  const update = (next: Stroke[]) => {
    strokesRef.current = next;
    setStrokes(next);
  };

  const emit = (next: Stroke[]) => {
    update(next);
    onChange(next, pad());
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the gesture: the screen behind mustn't scroll while signing.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          onDrawing?.(true);
          const { locationX, locationY } = e.nativeEvent;
          current.current = [[locationX, locationY]];
          update([...strokesRef.current, current.current]);
        },
        onPanResponderMove: (e) => {
          if (!current.current) return;
          const { locationX, locationY } = e.nativeEvent;
          const last = current.current[current.current.length - 1];
          // Skip near-duplicate points: smaller payload, same line.
          if (Math.hypot(locationX - last[0], locationY - last[1]) < 1.5) return;
          current.current.push([locationX, locationY]);
          update([...strokesRef.current.slice(0, -1), [...current.current]]);
        },
        onPanResponderTerminate: () => {
          current.current = null;
          onDrawing?.(false);
          onChange(strokesRef.current, pad());
        },
        onPanResponderRelease: () => {
          current.current = null;
          onDrawing?.(false);
          onChange(strokesRef.current, pad());
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
  };

  return (
    <View>
      <View
        onLayout={onLayout}
        style={[styles.pad, { height, backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
        {...responder.panHandlers}
      >
        <Svg width="100%" height="100%">
          {strokes.map((stroke, i) => (
            <Path
              key={i}
              d={toPath(stroke)}
              stroke={colors.text}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
        {strokes.length === 0 && (
          <View pointerEvents="none" style={styles.placeholder}>
            <AppText variant="footnote" color="textTertiary">Sign here with your finger</AppText>
          </View>
        )}
        <View pointerEvents="none" style={[styles.line, { borderColor: colors.border }]} />
      </View>
      <Pressable onPress={() => emit([])} hitSlop={8} style={styles.clear} accessibilityRole="button" accessibilityLabel="Clear signature">
        <AppText variant="subhead" color="primaryStrong">Clear</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { borderWidth: 1, borderRadius: Radius.md, overflow: "hidden" },
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  line: { position: "absolute", left: Space.lg, right: Space.lg, bottom: 36, borderBottomWidth: 1 },
  clear: { alignSelf: "flex-end", paddingVertical: Space.xs },
});
