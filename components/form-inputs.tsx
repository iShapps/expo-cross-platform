import type { AgreementInput } from "@/api-queries/agreements";
import { AppText, Icon, TextField } from "@/components/design";
import { Radius, Space, Touch } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import React from "react";
import { Pressable, StyleSheet, View, type KeyboardTypeOptions } from "react-native";

/**
 * The questions of a contract or form, answered before signing (backend
 * ContractTemplateService::workerInputs). Answers are strings: a date as
 * YYYY-MM-DD, a tick as "yes", a choice as one of its options. A question with
 * show_if is asked only when that other answer is one of its values; the
 * server checks everything again (cleanWorkerInputs).
 */

export type Answers = Record<string, string>;

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

/** Typed date, masked as YYYY-MM-DD. */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)];
  return parts.filter(Boolean).join("-");
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** The ATO's TFN check digit (9 or 8 digits). */
function validTfn(digits: string): boolean {
  const weights = digits.length === 9 ? [1, 4, 3, 7, 5, 8, 6, 9, 10] : digits.length === 8 ? [10, 7, 8, 4, 6, 3, 5, 1] : null;
  if (!weights) return false;
  return digits.split("").reduce((sum, d, i) => sum + Number(d) * weights[i], 0) % 11 === 0;
}

/** The ABN checksum: first digit minus one, weights 10,1,3,…,19, divisible by 89. */
function validAbn(digits: string): boolean {
  if (digits.length !== 11) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const n = digits.split("").map(Number);
  n[0] -= 1;
  return n.reduce((sum, d, i) => sum + d * weights[i], 0) % 89 === 0;
}

/** Whether a question is asked, given the answers so far. */
export function isAsked(input: AgreementInput, answers: Answers): boolean {
  if (!input.show_if) return true;
  return input.show_if.values.includes((answers[input.show_if.key] ?? "").trim());
}

/** What's wrong with one answer as typed (null when fine or empty). */
export function answerError(input: AgreementInput, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (input.type === "date") return isValidIsoDate(value) ? null : "Enter a valid date as YYYY-MM-DD.";
  switch (input.format) {
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Enter a valid email address.";
    case "phone": return digits.length >= 8 && digits.length <= 15 ? null : "Enter a valid phone number.";
    case "postcode": return /^\d{4}$/.test(value) ? null : "A postcode is 4 digits.";
    case "state": return STATES.includes(value.toUpperCase()) ? null : `Use one of ${STATES.join(", ")}.`;
    case "tfn": return validTfn(digits) ? null : "That isn't a valid tax file number. Check the digits.";
    case "abn": return validAbn(digits) ? null : "That isn't a valid ABN. Check the digits.";
    case "bsb": return digits.length === 6 ? null : "A BSB is 6 digits.";
    case "account": return /^\d{5,10}$/.test(value.replace(/[\s-]/g, "")) ? null : "An account number is 5 to 10 digits.";
    case "usi": return /^[A-Za-z0-9]{3,20}$/.test(value.replace(/\s/g, "")) ? null : "Enter the USI as your fund gives it (letters and numbers).";
    case "digits": return /^\d+$/.test(value.replace(/\s/g, "")) ? null : "Numbers only.";
  }
  return null;
}

/** Every asked question answered (required ones) and every answer valid. */
export function answersReady(inputs: AgreementInput[], answers: Answers): boolean {
  return inputs.every((i) => {
    if (!isAsked(i, answers)) return true;
    const value = (answers[i.key] ?? "").trim();
    if (i.type === "checkbox") return !i.required || value === "yes";
    return value ? !answerError(i, value) : !i.required;
  });
}

/** The answers to send: asked questions only, blanks dropped. */
export function answersToSend(inputs: AgreementInput[], answers: Answers): { key: string; value: string }[] {
  return inputs
    .filter((i) => isAsked(i, answers))
    .map((i) => ({ key: i.key, value: (answers[i.key] ?? "").trim() }))
    .filter((i) => i.value !== "");
}

const keyboardFor = (input: AgreementInput): KeyboardTypeOptions | undefined => {
  if (input.type === "date") return "number-pad";
  switch (input.format) {
    case "email": return "email-address";
    case "phone": return "phone-pad";
    case "postcode": case "tfn": case "abn": case "bsb": case "account": case "digits": return "number-pad";
  }
  return undefined;
};

export function FormInputs({ inputs, answers, onChange }: { inputs: AgreementInput[]; answers: Answers; onChange: (key: string, value: string) => void }) {
  return (
    <View style={{ gap: Space.md }}>
      {inputs.filter((i) => isAsked(i, answers)).map((input) => (
        <Question key={input.key} input={input} value={answers[input.key] ?? ""} onChange={(v) => onChange(input.key, v)} />
      ))}
    </View>
  );
}

function Question({ input, value, onChange }: { input: AgreementInput; value: string; onChange: (value: string) => void }) {
  const { colors } = useAppTheme();
  const label = input.required || input.type === "checkbox" ? input.label : `${input.label} (optional)`;

  if (input.type === "checkbox") {
    const ticked = value === "yes";
    return (
      <View style={{ gap: Space.xxs }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ticked }}
          onPress={() => onChange(ticked ? "" : "yes")}
          style={styles.choiceRow}
          hitSlop={4}
        >
          <Icon name={ticked ? "checkbox" : "square-outline"} size={24} color={ticked ? colors.primaryStrong : colors.textTertiary} />
          <AppText variant="callout" style={{ flex: 1 }}>{input.required ? input.label : label}</AppText>
        </Pressable>
        {!!input.help && <AppText variant="footnote" color="textSecondary">{input.help}</AppText>}
      </View>
    );
  }

  if (input.type === "choice") {
    return (
      <View style={{ gap: Space.xs }} accessibilityRole="radiogroup" accessibilityLabel={input.label}>
        <AppText variant="subhead">{label}</AppText>
        {!!input.help && <AppText variant="footnote" color="textSecondary">{input.help}</AppText>}
        <View style={[styles.choices, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {input.options.map((option, i) => {
            const on = value === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => onChange(on && !input.required ? "" : option)}
                style={[styles.choiceRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
              >
                <Icon name={on ? "radio-button-on" : "radio-button-off"} size={22} color={on ? colors.primaryStrong : colors.textTertiary} />
                <AppText variant="callout" style={{ flex: 1 }}>{option}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  const isDate = input.type === "date";
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={(text) => onChange(isDate ? formatDateInput(text) : text)}
      keyboardType={keyboardFor(input)}
      autoCapitalize={input.format === "email" ? "none" : input.format === "state" || input.format === "usi" ? "characters" : "sentences"}
      autoCorrect={!input.format}
      multiline={input.type === "multiline"}
      maxLength={isDate ? 10 : input.type === "multiline" ? 2000 : input.max ?? 300}
      placeholder={isDate ? "YYYY-MM-DD" : undefined}
      icon={isDate ? "calendar-outline" : undefined}
      hint={input.help ?? undefined}
      error={answerError(input, value)}
      secureTextEntry={false}
    />
  );
}

const styles = StyleSheet.create({
  choices: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: "hidden" },
  choiceRow: { flexDirection: "row", alignItems: "center", gap: Space.sm, minHeight: Touch.min, paddingHorizontal: Space.sm, paddingVertical: Space.xs },
});
