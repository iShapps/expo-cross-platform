import { resolveTenantsByEmail, TenancyQueryError } from "@/api-queries/tenancy";
import { AppButton, AuthLayout, TextField } from "@/components/design";
import { OrganizationPicker } from "@/components/organization-picker";
import { Space } from "@/constants/design";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { TenantSummary } from "@/data-types/tenancy";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type Step = "email" | "picker";

export default function TenantCode() {
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


  if (step === "picker") {
    return (
      <AuthLayout
        title="Choose an organization"
        subtitle={`${email.trim()} belongs to more than one organization.`}
      >
        <View style={styles.form}>
          <OrganizationPicker
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={(tenant) => setSelectedTenantId(tenant.tenantId)}
            disabled={isSubmitting}
          />

          <View style={styles.actions}>
            <AppButton
              title="Continue"
              icon="arrow-forward"
              iconPosition="right"
              onPress={handleConfirmSelection}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
            />
            <AppButton
              title="Back"
              variant="ghost"
              icon="arrow-back"
              onPress={() => {
                setError(null);
                setStep("email");
              }}
              disabled={isSubmitting}
              fullWidth
            />
          </View>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Enter your email and we'll find your organization."
    >
      <View style={styles.form}>
        <TextField
          label="Email address"
          icon="mail-outline"
          value={email}
          inputMode="email"
          autoComplete="email"
          clearButtonMode="while-editing"
          autoFocus
          clearTextOnFocus={false}
          enterKeyHint="go"
          placeholder="johnwilliams@gmail.com"
          onChangeText={(value) => {
            setEmail(value);
            if (error) setError(null);
          }}
          onSubmitEditing={handleLookup}
          editable={!isSubmitting}
          autoCapitalize="none"
          error={error}
        />

        <AppButton
          title="Continue"
          icon="arrow-forward"
          iconPosition="right"
          onPress={handleLookup}
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Space.lg,
  },
  actions: {
    gap: Space.xs,
  },
});
