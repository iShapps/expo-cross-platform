import { AppText, Icon } from "@/components/design";
import { Radius, Space, Touch, Type } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

type Option = { id: number; name: string };

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: number, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

/** A labelled field that opens a modal sheet of options — single select. */
export function DropdownField({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: Props) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <AppText variant="subhead">{label}</AppText>
      <Pressable
        onPress={() => !disabled && setVisible(true)}
        accessibilityRole="button"
        style={[
          styles.trigger,
          { borderColor: colors.surfaceMuted, backgroundColor: colors.surfaceMuted },
          disabled && { opacity: 0.5 },
        ]}
      >
        <AppText
          variant="body"
          color={value ? "text" : "textTertiary"}
          numberOfLines={1}
          style={styles.value}
        >
          {value || placeholder || `Select ${label.toLowerCase()}`}
        </AppText>
        <Icon name="chevron-down" size={18} color={colors.textTertiary} />
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setVisible(false)}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <AppText variant="title3" style={styles.title}>
              {label}
            </AppText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const selected = option.name === value;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onChange(option.id, option.name);
                      setVisible(false);
                    }}
                    style={[
                      styles.option,
                      selected && { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <AppText
                      variant="body"
                      color={selected ? "primaryStrong" : "text"}
                      style={selected && styles.optionTextActive}
                    >
                      {option.name}
                    </AppText>
                    {selected && (
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={colors.primaryStrong}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Space.xs,
  },
  trigger: {
    minHeight: Touch.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Space.xs,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
  },
  value: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: Space.gutter,
  },
  sheet: {
    maxHeight: "70%",
    borderRadius: Radius.xxl,
    padding: Space.md,
    gap: Space.xs,
  },
  title: {
    paddingHorizontal: Space.xs,
    paddingVertical: Space.xs,
  },
  option: {
    minHeight: Touch.min + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Space.sm,
    borderRadius: Radius.md,
  },
  optionTextActive: {
    fontFamily: Type.button.fontFamily,
  },
});
