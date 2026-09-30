import { FontFamily, Radius, Space, Touch, Type } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { forwardRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { AppText } from "./app-text";
import { Icon, type IconName } from "./icon";

export type TextFieldProps = Omit<TextInputProps, "style"> & {
  label?: string;
  icon?: IconName;
  /** Password field: hides the text and adds a show/hide toggle. */
  secure?: boolean;
  /** Extra control at the end of the field (e.g. biometrics button). */
  accessory?: ReactNode;
  error?: string | null;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Filled, rounded input (52pt) with label, leading icon, error and password toggle. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon, secure = false, accessory, error, hint, containerStyle, editable = true, onFocus, onBlur, ...inputProps },
  ref,
) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.surfaceMuted;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label && (
        <AppText variant="subhead" color={error ? "danger" : "text"}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.field,
          {
            backgroundColor: focused ? colors.surface : colors.surfaceMuted,
            borderColor,
            opacity: editable ? 1 : 0.7,
          },
        ]}
      >
        {icon && <Icon name={icon} size={20} color={focused ? colors.primaryStrong : colors.textTertiary} />}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          secureTextEntry={secure && !revealed}
          style={[styles.input, { color: editable ? colors.text : colors.textSecondary }]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {accessory}
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={styles.toggle}
          >
            <Icon name={revealed ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>
      {error ? (
        <AppText variant="footnote" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="footnote" color="textTertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: Space.xs,
  },
  field: {
    minHeight: Touch.button,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
  input: {
    flex: 1,
    alignSelf: "stretch",
    fontFamily: FontFamily.regular,
    fontSize: Type.body.fontSize,
    paddingVertical: 0,
  },
  toggle: {
    minWidth: 32,
    minHeight: Touch.min,
    alignItems: "center",
    justifyContent: "center",
  },
});
