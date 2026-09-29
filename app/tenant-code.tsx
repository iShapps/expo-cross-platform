import { resolveTenantsByEmail, TenancyQueryError } from "@/api-queries/tenancy";
import { OrganizationPicker } from "@/components/organization-picker";
import { Colors, Radii } from "@/constants/theme";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { TenantSummary } from "@/data-types/tenancy";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = "email" | "picker";

export default function TenantCode() {
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const proceedToLogin = (tenant: TenantSummary, forEmail: string) => {
    useTenantStore.getState().setTenant(tenant, forEmail);
    router.replace({
      pathname: "/(open)/login",
      params: { email: forEmail },
    });
  };

  const handleLookup = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const matches = await resolveTenantsByEmail(trimmed);

      if (matches.length === 0) {
        setError("We couldn't find an organization for that email.");
        return;
      }

      if (matches.length === 1) {
        proceedToLogin(matches[0], trimmed);
        return;
      }

      setTenants(matches);
      setSelectedTenantId(matches[0].tenantId);
      setStep("picker");
    } catch (err) {
      setError(
        err instanceof TenancyQueryError
          ? err.message
          : "Could not look up your organization. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSelection = () => {
    const chosen = tenants.find((t) => t.tenantId === selectedTenantId);
    if (!chosen) return;
    proceedToLogin(chosen, email.trim());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View
          style={{
            backgroundColor: theme.background,
            height: 350,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Image
            source={require("@/assets/images/careworker2.jpg")}
            style={{ width: "100%", height: "100%", opacity: 0.5 }}
            contentFit="cover"
          />
        </View>

        <View style={styles.bottomContainer}>
          {step === "email" && (
            <>
              <View style={{ marginBottom: 20, marginTop: 10 }}>
                <Text style={styles.heading}>Sign in</Text>
                <Text style={styles.subheading}>
                  Enter your email and we&apos;ll find your organization.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={email ? styles.labelFilled : styles.label}>
                  Email Address
                </Text>
                <View
                  style={
                    email
                      ? styles.inputWrapFilled
                      : styles.inputWrap
                  }
                >
                  <TextInput
                    value={email}
                    inputMode="email"
                    autoComplete="email"
                    clearButtonMode="while-editing"
                    autoFocus
                    clearTextOnFocus={false}
                    cursorColor={theme.primaryText}
                    enterKeyHint="go"
                    placeholder="johnwilliams@gmail.com"
                    onChangeText={(value) => {
                      setEmail(value);
                      if (error) setError(null);
                    }}
                    onSubmitEditing={handleLookup}
                    placeholderTextColor={theme.secondaryText}
                    editable={!isSubmitting}
                    autoCapitalize="none"
                    style={{ flex: 1, color: theme.primaryText }}
                  />
                </View>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, isSubmitting && { opacity: 0.6 }]}
                onPress={handleLookup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.white} />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === "picker" && (
            <>
              <View style={{ marginBottom: 20, marginTop: 10 }}>
                <Text style={styles.heading}>Choose an organization</Text>
                <Text style={styles.subheading}>
                  {email.trim()} belongs to more than one organization.
                </Text>
              </View>

              <OrganizationPicker
                tenants={tenants}
                selectedTenantId={selectedTenantId}
                onSelect={(tenant) => setSelectedTenantId(tenant.tenantId)}
                disabled={isSubmitting}
                theme={theme}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[
                  styles.button,
                  { marginTop: 20 },
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleConfirmSelection}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.white} />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  setError(null);
                  setStep("email");
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      backgroundColor: theme.whiteBackground,
    },
    bottomContainer: {
      width: "100%",
      flexGrow: 1,
      backgroundColor: theme.whiteBackground,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderTopRightRadius: Radii.lg,
      borderTopLeftRadius: Radii.lg,
      marginTop: -30,
    },
    heading: {
      fontSize: 28,
      color: theme.primaryText,
      fontWeight: "700",
      marginBottom: 10,
    },
    subheading: {
      fontSize: 14,
      color: theme.secondaryText,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputWrap: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryText,
      paddingVertical: 8,
      fontSize: 16,
      gap: 8,
    },
    inputWrapFilled: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.primary,
      paddingVertical: 8,
      fontSize: 16,
      gap: 8,
    },
    label: {
      fontSize: 14,
      color: theme.primaryText,
      fontWeight: "700",
      marginBottom: 6,
    },
    labelFilled: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "700",
      marginBottom: 6,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
      marginTop: 4,
      marginBottom: 4,
    },
    button: {
      backgroundColor: theme.activeText,
      paddingVertical: 10,
      borderRadius: Radii.sm,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 6,
    },
    buttonText: {
      color: theme.white,
      fontSize: 16,
      fontWeight: "400",
    },
    linkButton: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
      padding: 4,
    },
    linkText: {
      color: theme.activeText,
      fontSize: 13,
      fontWeight: "600",
    },
  });
