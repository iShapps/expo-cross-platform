import {
  resolveTenantsByEmail,
  TenancyQueryError,
} from "@/api-queries/tenancy";
import {
  AppButton,
  AppText,
  AuthLayout,
  IconButton,
  OrgLogo,
  TextField,
} from "@/components/design";
import { OrganizationPicker } from "@/components/organization-picker";
import { Space, Touch } from "@/constants/design";
import { useSettingsStore } from "@/data-store/use-settings-store";
import { useTenantStore } from "@/data-store/use-tenant-store";
import LoginCredentials from "@/data-types/auth";
import { TenantSummary } from "@/data-types/tenancy";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import {
  ensureOneSignalSubscriptionId,
  waitForSubscriptionId,
} from "@/hooks/use-one-signal";
import { login as apiLogin } from "@/utils/auth-api";
import {
  authenticateWithBiometrics,
  isBiometricAllowed,
  isBiometricAvailable,
} from "@/utils/biometrics";
import { debug, error as logError } from "@/utils/logger";
import {
  getLoginCredentials,
  saveLoginCredentials,
} from "@/utils/secure-login-credentials";
import { useIsFocused } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import { Checkbox } from "expo-checkbox";
import * as Device from "expo-device";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { useSession } from "../ctx";

const WalkthroughableView = walkthroughable(View);

const backfillDeviceId = async (credentials: {
  email: string;
  password: string;
  device_name?: string;
  device_type?: string;
  device_version?: string;
}) => {
  try {
    const subscriptionId = await waitForSubscriptionId(30000);

    if (!subscriptionId) {
      debug("Device id backfill: no subscription id resolved in time");
      return;
    }

    await apiLogin({ ...credentials, device_id: subscriptionId });
    debug("Device id backfilled after login:", subscriptionId);
  } catch (err) {
    logError("Device id backfill failed:", err);
  }
};

export default function Login() {
  const { colors } = useAppTheme();
  const organizationName = useTenantStore((state) => state.tenant?.name);
  const organizationLogoUrl = useTenantStore((state) => state.tenant?.logoUrl);
  const persistedTenantEmail = useTenantStore((state) => state.tenant?.email);
  const hasPersistedTenant = useTenantStore((state) => !!state.tenant);
  const router = useRouter();

  const isFocused = useIsFocused();

  useFirstVisitTour("login", isFocused);

  // Set when arriving from the tenant resolution screen,
  // which already looked up the organization for this email — lock it so a
  // manual edit here can't silently drift from the tenant we already picked.
  const params = useLocalSearchParams<{ email?: string }>();
  const emailPrefilled = !!params.email;

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [isTermsChecked, setIsTermsChecked] = useState(true);
  const { signIn, isLoading } = useSession();
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const isLoginBusy = isLoading || isSubmittingLogin;

  const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [switchableTenants, setSwitchableTenants] = useState<TenantSummary[]>(
    [],
  );
  const [switchSelectedTenantId, setSwitchSelectedTenantId] = useState<
    string | null
  >(null);
  const [switchLookupEmail, setSwitchLookupEmail] = useState("");

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricAllowed, setBiometricAllowed] = useState(false);

  const biometricsEnabled = useSettingsStore(
    (state) => state.biometricsEnabled,
  );

  const isMountedRef = useRef(true);
  const loginInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check for biometric support on mount
  useEffect(() => {
    (async () => {
      setBiometricSupported(await isBiometricAvailable());
    })();
  }, []);

  // Check if biometrics are allowed
  useEffect(() => {
    (async () => {
      setBiometricAllowed(await isBiometricAllowed());
    })();
  }, []);

  const handleLogin = async () => {
    if (isLoginBusy || loginInFlightRef.current) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "info",
        message: "login.submit_ignored",
        data: {
          reason: "already_submitting",
        },
      });
      return;
    }

    // check if terms are accepted
    if (!isTermsChecked) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "warning",
        message: "login.validation_failed",
        data: {
          reason: "terms_not_accepted",
          hasEmail: email.trim().length > 0,
          hasPassword: password.trim().length > 0,
        },
      });
      Alert.alert(
        "Terms Required",
        "You must agree to the terms and privacy policy.",
        [{ text: "OK" }],
      );
      return;
    }

    if (!email.trim()) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "warning",
        message: "login.validation_failed",
        data: {
          reason: "missing_email",
          hasEmail: false,
          hasPassword: password.trim().length > 0,
        },
      });
      Alert.alert("Login Failed", "Email is required", [{ text: "OK" }]);
      return;
    }

    if (!password.trim()) {
      Sentry.addBreadcrumb({
        category: "auth.login",
        level: "warning",
        message: "login.validation_failed",
        data: {
          reason: "missing_password",
          hasEmail: true,
          hasPassword: false,
        },
      });
      Alert.alert("Login Failed", "Password is required", [{ text: "OK" }]);
      return;
    }

    loginInFlightRef.current = true;
    setIsSubmittingLogin(true);

    try {
      const subscriptionId = await ensureOneSignalSubscriptionId();

      const loginPayload: LoginCredentials = {
        email,
        password,
        // optionals : get device info
        // Device.modelName; // Android: "Pixel 2"; iOS: "iPhone XS Max"; web: "iPhone", null
        // Device.osBuildId; // Android: "PSR1.180720.075"; iOS: "16F203"; web: null
        // Device.osInternalBuildId; // Android: "MMB29K"; iOS: "16F203"; web: null,
        // Device.osName; // Android: "Android"; iOS: "iOS" or "iPadOS"; web: "iOS", "Android", "Windows"
        // Device.osVersion; // Android: "4.0.3"; iOS: "12.3.1"; web: "11.0", "8.1.0"
        // Device.manufacturer; // Android: "Google", "xiaomi"; iOS: "Apple"; web: "Google", null
        // Device.deviceType; // UNKNOWN, PHONE, TABLET, TV, DESKTOP
        // Device.deviceName; // "Vivian's iPhone XS"
        // Device.designName; // Android: "kminilte"; iOS: null; web: null
        // Device.brand; // Android: "google", "xiaomi"; iOS: "Apple"; web: null
        device_name: Device.deviceName ?? Device.modelName ?? "Unknown Device",
        device_type: Device.deviceType?.toString() ?? "Unknown Device", //Device.osName ?? "Unknown Device",
        device_version: Device.osVersion ?? "Unknown Version",
        device_id: "",
      };

      if (subscriptionId) {
        loginPayload.device_id = subscriptionId;
      }

      const signInResult = await signIn(loginPayload);

      if (!isMountedRef.current) {
        return;
      }

      if (
        signInResult === "onboarding" ||
        signInResult === "password-reset-required"
      ) {
        return;
      }

      if (!subscriptionId) {
        // Login succeeded but we didn't have a subscription id in time —
        // keep waiting in the background and silently re send it once
        // OneSignal has one.
        void backfillDeviceId({
          email,
          password,
          device_name: loginPayload.device_name,
          device_type: loginPayload.device_type,
          device_version: loginPayload.device_version,
        });
      }

      if (biometricSupported && biometricAllowed) {
        await saveLoginCredentials(email, password);
      }

      // Ask for biometric consent after successful login if supported but not yet allowed
      if (biometricSupported && !biometricAllowed) {
        Alert.alert(
          "Enable Biometric Login?",
          "Would you like to enable biometric login for future sign-ins? Your credentials will be securely stored.",
          [
            {
              text: "Yes",
              onPress: async () => {
                await saveLoginCredentials(email, password);
                Alert.alert(
                  "Biometric login enabled",
                  "You can now use biometrics to sign in.",
                );
              },
            },
            {
              text: "No",
              style: "cancel",
            },
          ],
        );
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      loginInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsSubmittingLogin(false);
      }
    }
  };

  // Biometric login handler
  const handleBiometricLogin = async () => {
    if (!biometricSupported) {
      Alert.alert(
        "Biometrics not available",
        "Your device does not support biometric authentication or it is not set up.",
      );
      return;
    }
    try {
      const authenticated = await authenticateWithBiometrics(
        "Sign in with biometrics",
      );
      if (!authenticated) {
        Alert.alert(
          "Authentication failed",
          "Biometric authentication was not successful.",
        );
        return;
      }
      // Retrieve stored credentials
      const creds = await getLoginCredentials();
      if (!creds.email || !creds.password) {
        Alert.alert(
          "No credentials",
          "No credentials found for biometric login. Please sign in manually first.",
        );
        return;
      }
      setEmail(creds.email);
      setPassword(creds.password);
      // await signIn({ email: creds.email, password: creds.password });
    } catch (error) {
      console.error("Biometric login error:", error);
      Alert.alert("Login failed", "Could not sign in with stored credentials.");
    }
  };

  const handleOpenOrgSwitcher = async () => {
    const lookupEmail = email.trim() || persistedTenantEmail || "";
    if (!lookupEmail || isLoadingOrgs) return;

    setIsLoadingOrgs(true);
    try {
      const matches = await resolveTenantsByEmail(lookupEmail);

      if (matches.length <= 1) {
        Alert.alert(
          "Just one organization",
          "You don't have access to any other organizations yet.",
        );
        return;
      }

      setSwitchableTenants(matches);
      setSwitchSelectedTenantId(
        useTenantStore.getState().tenant?.tenantId ?? matches[0].tenantId,
      );
      setSwitchLookupEmail(lookupEmail);
      setOrgSwitcherOpen(true);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof TenancyQueryError
          ? err.message
          : "Could not load your organizations. Please try again.",
      );
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const handleConfirmOrgSwitch = () => {
    const chosen = switchableTenants.find(
      (t) => t.tenantId === switchSelectedTenantId,
    );
    if (!chosen) return;
    setPassword("");
    setEmail(switchLookupEmail);
    useTenantStore.getState().setTenant(chosen, switchLookupEmail);
    setOrgSwitcherOpen(false);
  };

  if (orgSwitcherOpen) {
    return (
      <AuthLayout
        title="Choose an organization"
        subtitle={`${switchLookupEmail} belongs to more than one organization.`}
      >
        <View style={styles.form}>
          <OrganizationPicker
            tenants={switchableTenants}
            selectedTenantId={switchSelectedTenantId}
            onSelect={(tenant) => setSwitchSelectedTenantId(tenant.tenantId)}
          />

          <View style={styles.actions}>
            <AppButton
              title="Continue"
              icon="arrow-forward"
              iconPosition="right"
              onPress={handleConfirmOrgSwitch}
              fullWidth
            />
            <AppButton
              title="Cancel"
              variant="ghost"
              icon="arrow-back"
              onPress={() => setOrgSwitcherOpen(false)}
              fullWidth
            />
          </View>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      identity={
        organizationName || organizationLogoUrl ? (
          <OrgLogo
            name={organizationName}
            uri={organizationLogoUrl}
            size={64}
          />
        ) : undefined
      }
      title="Welcome back"
      subtitle={
        organizationName
          ? `Sign in to ${organizationName} to manage your shifts.`
          : "Sign in to securely access your account and manage your shifts anytime."
      }
    >
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <TextField
            label="Email address"
            icon="mail-outline"
            value={email}
            inputMode="email"
            autoComplete="email"
            clearButtonMode="while-editing"
            autoFocus={!emailPrefilled}
            editable={!emailPrefilled}
            clearTextOnFocus={false}
            enterKeyHint="next"
            placeholder="johnwilliams@gmail.com"
            onChangeText={setEmail}
            accessory={
              biometricSupported && biometricAllowed && biometricsEnabled ? (
                <IconButton
                  icon={Platform.OS === "ios" ? "scan-outline" : "finger-print"}
                  accessibilityLabel="Sign in with biometrics"
                  variant="plain"
                  iconColor={colors.primaryStrong}
                  onPress={handleBiometricLogin}
                />
              ) : undefined
            }
          />
          {(hasPersistedTenant || emailPrefilled) && (
            <View style={styles.prefilledActions}>
              {hasPersistedTenant && (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.inlineLink}
                  disabled={isLoadingOrgs}
                  onPress={handleOpenOrgSwitcher}
                >
                  <AppText variant="subhead" color="primaryStrong">
                    {isLoadingOrgs
                      ? "Loading organizations…"
                      : "Switch organization"}
                  </AppText>
                </Pressable>
              )}
              {emailPrefilled && (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.inlineLink}
                  onPress={() => {
                    useTenantStore.getState().clearTenant();
                    router.replace("/tenant-code");
                  }}
                >
                  <AppText variant="subhead" color="textSecondary">
                    Not you? Use a different email
                  </AppText>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <TextField
          label="Password"
          icon="lock-closed-outline"
          secure
          value={password}
          keyboardType="default"
          enterKeyHint="done"
          clearButtonMode="while-editing"
          autoComplete="password"
          autoFocus={emailPrefilled}
          clearTextOnFocus={false}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        <CopilotStep
          name="login-forgot-password"
          order={1}
          active={isFocused}
          text="Forgot your password? Tap here to reset it via email."
        >
          <WalkthroughableView style={styles.forgotWrap}>
            <Link href="/(open)/forgot-password" asChild>
              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                style={styles.inlineLink}
              >
                <AppText variant="subhead" color="primaryStrong">
                  Forgot password?
                </AppText>
              </Pressable>
            </Link>
          </WalkthroughableView>
        </CopilotStep>

        <View style={styles.termsRow}>
          {/* 22pt box with a 44pt tap area */}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isTermsChecked }}
            accessibilityLabel="I agree to the terms and conditions and privacy policy"
            hitSlop={11}
            onPress={() => setIsTermsChecked(!isTermsChecked)}
          >
            <Checkbox
              style={styles.checkbox}
              value={isTermsChecked}
              onValueChange={setIsTermsChecked}
              color={isTermsChecked ? colors.primary : colors.borderStrong}
            />
          </Pressable>
          <AppText
            variant="footnote"
            color="textSecondary"
            style={styles.termsText}
          >
            I agree to the{" "}
            <Link href="https://smarthealthcaresolutions.com.au/terms-of-use">
              <AppText
                variant="footnote"
                color="primaryStrong"
                style={styles.underline}
              >
                terms and conditions
              </AppText>
            </Link>{" "}
            &amp;{" "}
            <Link href="https://smarthealthcaresolutions.com.au/privacy-policy">
              <AppText
                variant="footnote"
                color="primaryStrong"
                style={styles.underline}
              >
                privacy policy
              </AppText>
            </Link>
          </AppText>
        </View>

        <CopilotStep
          name="login-sign-in"
          order={2}
          active={isFocused}
          text="Enter your email and password, then tap here to sign in."
        >
          <WalkthroughableView>
            <AppButton
              title="Sign in"
              icon="arrow-forward"
              iconPosition="right"
              loading={isLoginBusy}
              loadingTitle="Signing you in…"
              onPress={handleLogin}
              disabled={isLoginBusy}
              fullWidth
            />
          </WalkthroughableView>
        </CopilotStep>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Space.md,
  },
  fieldGroup: {
    gap: Space.xxs,
  },
  prefilledActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
  },
  inlineLink: {
    minHeight: Touch.min,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  actions: {
    gap: Space.xs,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -Space.xs,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    minHeight: Touch.min,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  termsText: {
    flex: 1,
  },
  underline: {
    textDecorationLine: "underline",
  },
});
