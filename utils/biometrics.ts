import * as LocalAuthentication from "expo-local-authentication";

// Checks if biometric authentication is available on the device.
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

// Prompts the user for biometric authentication (FaceID, TouchID, or device credentials).
export async function authenticateWithBiometrics(
  promptMessage = "Authenticate with biometrics",
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return false;
  }
}

// Gets the supported biometric types on the device (e.g., fingerprint, face, iris).
export async function getSupportedBiometricTypes(): Promise<
  LocalAuthentication.AuthenticationType[]
> {
  return LocalAuthentication.supportedAuthenticationTypesAsync();
}
