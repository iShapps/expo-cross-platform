import { getStates, State } from "@/api-queries/onboarding";
import {
  postProfile,
  ProfileQueryError,
  sendMobileVerification,
  updatePersonalDetails,
  UpdatePersonalDetailsPayload,
  verifyMobile,
} from "@/api-queries/profile";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import {
  AppButton,
  AppText,
  BusyOverlay,
  ScreenHeader,
  SegmentedTabs,
  TextField,
} from "@/components/design";
import { DropdownField } from "@/components/dropdown-field";
import { Space } from "@/constants/design";
import { useProfileData } from "@/data-store/use-account-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatDateInput,
  getDateError,
  getPartialDateError,
} from "@/utils/date-input";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../ctx";

const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

export default function EditProfileScreen() {
  const { colors } = useAppTheme();
  const { updateHcp } = useSession();
  const profileStore = useProfileData();
  const hcp = profileStore.userDetails?.hcp;

  const [firstName, setFirstName] = useState(hcp?.first_name ?? "");
  const [lastName, setLastName] = useState(hcp?.last_name ?? "");
  const [gender, setGender] = useState(hcp?.gender ?? "");
  const [address, setAddress] = useState(hcp?.address ?? "");
  const [latitude, setLatitude] = useState(hcp?.latitude ?? "");
  const [longitude, setLongitude] = useState(hcp?.longitude ?? "");
  const [city, setCity] = useState(hcp?.city_name ?? "");
  const [suburb, setSuburb] = useState(hcp?.suburb_name ?? "");
  const [postCode, setPostCode] = useState(hcp?.post_code ?? "");
  const [stateId, setStateId] = useState<number | null>(hcp?.state_id ?? null);
  const [stateName, setStateName] = useState("");
  const [maximumDistance, setMaximumDistance] = useState(
    hcp?.maximum_distance ? String(hcp.maximum_distance) : "",
  );
  const [dateOfBirth, setDateOfBirth] = useState(hcp?.date_of_birth ?? "");
  const [dateOfBirthError, setDateOfBirthError] = useState<string>();

  const [states, setStates] = useState<State[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Phone number can only change through hcp/send-mobile-verification →
  // hcp/verify-mobile (an OTP round trip) — verify-mobile only confirms the
  // code, it never persists the number, so a successful verify is followed
  // by a normal updatePersonalDetails() save carrying contact_number.
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [requestToken, setRequestToken] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // getStates() only gives us {id, name} pairs — the locally-cached hcp
  // record only has state_id, no name, so the dropdown can't show the
  // current selection until this resolves.
  useEffect(() => {
    let cancelled = false;
    getStates()
      .then((res) => {
        if (cancelled) return;
        setStates(res.data.states);
        if (hcp?.state_id) {
          const match = res.data.states.find((s) => s.id === hcp.state_id);
          if (match) setStateName(match.name);
        }
      })
      .catch(() => {
        // Dropdown just stays empty — the rest of the form is still usable.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hcp?.state_id]);

  const genderActiveIndex = GENDER_OPTIONS.findIndex(
    (option) => option.toLowerCase() === gender,
  );

  // Shared by the main save and the phone-verification save below — both
  // resend the full required field set, same as updateProfilePhoto already
  // does for a photo-only change.
  const buildPayload = (
    overrides: Partial<UpdatePersonalDetailsPayload> = {},
  ): UpdatePersonalDetailsPayload => {
    const parsedDistance = Number(maximumDistance);
    const maximumDistanceValue =
      maximumDistance.trim() && !Number.isNaN(parsedDistance)
        ? parsedDistance
        : undefined;

    return {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      country_id: hcp!.country_id,
      state_id: stateId!,
      address: address.trim(),
      latitude,
      longitude,
      city: city || undefined,
      suburb: suburb || undefined,
      post_code: postCode || undefined,
      gender: gender || undefined,
      date_of_birth: dateOfBirth || undefined,
      maximum_distance: maximumDistanceValue,
      ...overrides,
    };
  };

  // This backend returns HTTP 200 even for a rejected save — an unchecked
  // response here would silently look like a success that just didn't
  // change anything.
  const applyRefreshedProfile = async () => {
    const refreshed = await postProfile();
    if (!refreshed.status) return;

    const updated = refreshed.data.hcp;
    updateHcp({
      first_name: updated.first_name,
      last_name: updated.last_name,
      gender: updated.gender,
      address: updated.address,
      city_name: updated.city_name,
      suburb_name: updated.suburb_name,
      post_code: updated.post_code,
      state_id: updated.state_id,
      latitude: updated.latitude,
      longitude: updated.longitude,
      date_of_birth: updated.date_of_birth,
      contact_number: updated.contact_number,
      maximum_distance: updated.maximum_distance,
    });
  };

  const handleSave = async () => {
    if (!hcp) return;

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "First and last name are required.");
      return;
    }
    if (!address.trim() || !latitude || !longitude) {
      Alert.alert(
        "Error",
        "Please select an address from the search results.",
      );
      return;
    }
    if (!stateId) {
      Alert.alert("Error", "Please select a state.");
      return;
    }
    const dobError = getDateError(dateOfBirth, {
      label: "Date of birth",
      allowFuture: false,
    });
    if (dobError) {
      Alert.alert("Error", dobError);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updatePersonalDetails(buildPayload());

      if (!result.status) {
        Alert.alert("Error", result.message || "Could not save your details.");
        return;
      }

      await applyRefreshedProfile();

      Alert.alert("Saved", "Your details have been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof ProfileQueryError
          ? err.message
          : "Could not save your details. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetPhoneFlow = () => {
    setIsChangingPhone(false);
    setNewPhone("");
    setOtpSent(false);
    setOtpCode("");
    setRequestToken("");
  };

  const handleSendCode = async () => {
    if (!newPhone.trim()) {
      Alert.alert("Error", "Enter the new phone number first.");
      return;
    }
    setIsSendingCode(true);
    try {
      const result = await sendMobileVerification(newPhone.trim());
      if (!result.status || !result.data?.request_token) {
        Alert.alert("Error", result.message || "Could not send a code.");
        return;
      }
      setRequestToken(result.data.request_token);
      setOtpSent(true);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof ProfileQueryError
          ? err.message
          : "Could not send a verification code. Please try again.",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!hcp || !otpCode.trim()) {
      Alert.alert("Error", "Enter the 6-digit code.");
      return;
    }
    setIsVerifyingPhone(true);
    try {
      const verified = await verifyMobile(otpCode.trim(), requestToken);
      if (!verified.status) {
        Alert.alert("Error", verified.message || "Incorrect or expired code.");
        return;
      }

      const saved = await updatePersonalDetails(
        buildPayload({ contact_number: newPhone.trim() }),
      );
      if (!saved.status) {
        Alert.alert("Error", saved.message || "Could not save your new number.");
        return;
      }

      await applyRefreshedProfile();
      resetPhoneFlow();
      Alert.alert("Saved", "Your phone number has been updated.");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof ProfileQueryError
          ? err.message
          : "Could not verify that code. Please try again.",
      );
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Edit account details" onBack={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <TextField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <TextField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <TextField
          label="Date of birth"
          value={dateOfBirth}
          onChangeText={(value) => {
            const formatted = formatDateInput(value, {
              maxYear: new Date().getFullYear(),
            });
            setDateOfBirth(formatted);
            setDateOfBirthError(
              getPartialDateError(formatted, {
                label: "Date of birth",
                allowFuture: false,
              }) ?? undefined,
            );
          }}
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
          error={dateOfBirthError}
        />

        <View style={styles.field}>
          <AppText variant="subhead">Phone number</AppText>
          {!isChangingPhone && (
            <View style={styles.phoneRow}>
              <AppText variant="bodyMedium">
                {hcp?.contact_number ?? "—"}
              </AppText>
              <AppButton
                title="Change"
                variant="secondary"
                onPress={() => setIsChangingPhone(true)}
              />
            </View>
          )}
          {isChangingPhone && !otpSent && (
            <View style={styles.field}>
              <TextField
                label="New phone number"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                placeholder="+61412345678"
              />
              <View style={styles.phoneActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={resetPhoneFlow}
                />
                <AppButton
                  title="Send code"
                  onPress={handleSendCode}
                  loading={isSendingCode}
                  disabled={isSendingCode}
                />
              </View>
            </View>
          )}
          {isChangingPhone && otpSent && (
            <View style={styles.field}>
              <AppText variant="footnote" color="textSecondary">
                Enter the 6-digit code sent to {newPhone}.
              </AppText>
              <TextField
                label="Verification code"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <View style={styles.phoneActions}>
                <AppButton
                  title="Cancel"
                  variant="secondary"
                  onPress={resetPhoneFlow}
                />
                <AppButton
                  title="Verify & save"
                  onPress={handleVerifyPhone}
                  loading={isVerifyingPhone}
                  disabled={isVerifyingPhone}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <AppText variant="subhead">Gender</AppText>
          <SegmentedTabs
            tabs={GENDER_OPTIONS}
            activeIndex={genderActiveIndex}
            onTabPress={(index) =>
              setGender(GENDER_OPTIONS[index].toLowerCase())
            }
          />
        </View>

        <AddressAutocomplete
          value={address}
          onSelect={(result) => {
            setAddress(result.address);
            setLatitude(result.latitude);
            setLongitude(result.longitude);
            setCity(result.city);
            setSuburb(result.suburb);
            setPostCode(result.postCode);
          }}
        />

        <DropdownField
          label="State"
          options={states}
          value={stateName}
          placeholder={isLoadingStates ? "Loading states…" : "Select state"}
          disabled={isLoadingStates}
          onChange={(id, name) => {
            setStateId(id);
            setStateName(name);
          }}
        />

        <TextField
          label="Maximum travel distance (km)"
          value={maximumDistance}
          onChangeText={setMaximumDistance}
          keyboardType="numeric"
          placeholder="e.g. 25"
        />

        <AppButton
          title="Save changes"
          icon="checkmark"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          fullWidth
        />
      </ScrollView>
      </KeyboardAvoidingView>

      {isSaving && <BusyOverlay message="Saving your details..." />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: Space.xxl,
    gap: Space.lg,
  },
  field: {
    gap: Space.xs,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Space.sm,
  },
  phoneActions: {
    flexDirection: "row",
    gap: Space.sm,
  },
});
