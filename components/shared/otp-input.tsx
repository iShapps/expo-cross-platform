import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import {
    Keyboard,
    StyleSheet,
    TextInput,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  onChange?: (otp: string) => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  focusedInputStyle?: TextStyle;
  filledInputStyle?: TextStyle;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
}

export interface OTPInputRef {
  clear: () => void;
  focus: () => void;
  getValue: () => string;
}

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
  (
    {
      length = 4,
      onComplete,
      onChange,
      containerStyle,
      inputStyle,
      focusedInputStyle,
      filledInputStyle,
      autoFocus = true,
      secureTextEntry = false,
    },
    ref,
  ) => {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
    const [focusedIndex, setFocusedIndex] = useState<number>(
      autoFocus ? 0 : -1,
    );
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Auto-focus first input on mount
    useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, [autoFocus]);

    // Clear function
    const clear = () => {
      setOtp(Array(length).fill(""));
      inputRefs.current[0]?.focus();
      onChange?.("");
    };

    // Focus function
    const focus = () => {
      inputRefs.current[0]?.focus();
    };

    // Get value function
    const getValue = () => {
      return otp.join("");
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      clear,
      focus,
      getValue,
    }));

    // Handle OTP change
    const handleChange = (text: string, index: number) => {
      // Only allow numbers
      const numericText = text.replace(/[^0-9]/g, "");

      // Handle paste - if multiple digits are pasted
      if (numericText.length > 1) {
        handlePaste(numericText);
        return;
      }

      // Single digit input
      if (numericText.length <= 1) {
        const newOtp = [...otp];
        newOtp[index] = numericText;
        setOtp(newOtp);

        // Call onChange callback
        const otpString = newOtp.join("");
        onChange?.(otpString);

        // Move to next input if digit was entered
        if (numericText && index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }

        // Check if OTP is complete
        if (
          newOtp.every((digit) => digit !== "") &&
          newOtp.join("").length === length
        ) {
          onComplete?.(newOtp.join(""));
          // dismiss keyboard
          Keyboard.dismiss();
        }
      }
    };

    // Handle paste
    const handlePaste = (pastedText: string) => {
      const numericText = pastedText.replace(/[^0-9]/g, "");
      const digits = numericText.slice(0, length).split("");

      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit;
        }
      });

      setOtp(newOtp);

      // Call onChange callback
      const otpString = newOtp.join("");
      onChange?.(otpString);

      // Focus on next empty input or last input
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[length - 1]?.focus();

        // Check if OTP is complete
        if (newOtp.every((digit) => digit !== "")) {
          onComplete?.(newOtp.join(""));
          Keyboard.dismiss();
        }
      }
    };

    // Handle backspace
    const handleKeyPress = (
      e: { nativeEvent: { key: string } },
      index: number,
    ) => {
      if (e.nativeEvent.key === "Backspace") {
        if (otp[index] === "") {
          // If current input is empty, move to previous input
          if (index > 0) {
            inputRefs.current[index - 1]?.focus();
            // Clear previous input
            const newOtp = [...otp];
            newOtp[index - 1] = "";
            setOtp(newOtp);
            onChange?.(newOtp.join(""));
          }
        } else {
          // Clear current input
          const newOtp = [...otp];
          newOtp[index] = "";
          setOtp(newOtp);
          onChange?.(newOtp.join(""));
        }
      }
    };

    // Handle focus
    const handleFocus = (index: number) => {
      setFocusedIndex(index);
    };

    // Handle blur
    const handleBlur = () => {
      setFocusedIndex(-1);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            style={[
              styles.input,
              inputStyle,
              focusedIndex === index && styles.focusedInput,
              focusedIndex === index && focusedInputStyle,
              digit !== "" && styles.filledInput,
              digit !== "" && filledInputStyle,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            secureTextEntry={secureTextEntry}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
          />
        ))}
      </View>
    );
  },
);

OTPInput.displayName = "OTPInput";

export const useOTPInput = (length: number = 4) => {
  const [otp, setOtp] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const handleChange = (value: string) => {
    setOtp(value);
    setIsComplete(value.length === length);
  };

  const handleComplete = (value: string) => {
    setOtp(value);
    setIsComplete(true);
  };

  const clear = () => {
    setOtp("");
    setIsComplete(false);
  };

  return {
    otp,
    isComplete,
    handleChange,
    handleComplete,
    clear,
  };
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  input: {
    width: 46,
    height: 46,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    backgroundColor: "#F9F9F9",
  },
  focusedInput: {
    borderColor: "#999",
    backgroundColor: "#FFF",
  },
  filledInput: {
    borderColor: "#4CAF50",
    backgroundColor: "#FFF",
  },
});

export default OTPInput;
