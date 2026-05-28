import {
  getOnboardingHcp,
  OnboardingHcpDetails,
} from "@/api-queries/onboarding";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { pickDocument } from "@/utils/file-pickers";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useSession } from "./ctx";

type OnboardingStepId = 1 | 2 | 3 | 4;

type UploadedFile = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

type DocumentRequirement = {
  id: string;
  name: string;
  mandatory: boolean;
  requiresExpiry: boolean;
};

type DocumentUploadState = Record<
  string,
  {
    file?: UploadedFile;
    expiry?: string;
  }
>;

const steps: {
  id: OnboardingStepId;
  title: string;
  eyebrow: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 1,
    title: "Basic details",
    eyebrow: "Profile",
    icon: "person-outline",
  },
  {
    id: 2,
    title: "Location details",
    eyebrow: "Address",
    icon: "location-outline",
  },
  {
    id: 3,
    title: "Professional documents",
    eyebrow: "Credentials",
    icon: "document-text-outline",
  },
  {
    id: 4,
    title: "Mandatory documents",
    eyebrow: "Compliance",
    icon: "shield-checkmark-outline",
  },
];

const professionDocumentRequirements: DocumentRequirement[] = [
  {
    id: "nursing-registration",
    name: "Nursing Registration",
    mandatory: true,
    requiresExpiry: true,
  },
  {
    id: "qualification",
    name: "Qualification Certificate",
    mandatory: true,
    requiresExpiry: false,
  },
  {
    id: "specialist-training",
    name: "Specialist Training",
    mandatory: false,
    requiresExpiry: true,
  },
];

const mandatoryDocumentRequirements: DocumentRequirement[] = [
  {
    id: "police-check",
    name: "Police Check",
    mandatory: true,
    requiresExpiry: true,
  },
  {
    id: "working-with-children",
    name: "Working With Children Check",
    mandatory: true,
    requiresExpiry: true,
  },
  {
    id: "identity-document",
    name: "Identity Document",
    mandatory: true,
    requiresExpiry: false,
  },
  {
    id: "covid-vaccination",
    name: "Vaccination Evidence",
    mandatory: false,
    requiresExpiry: false,
  },
];

const genderOptions = ["Female", "Male", "Non-binary"];
const stateOptions = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
];

function normalizeOnboardingStep(step: number): OnboardingStepId {
  if (step === 2) return 2;
  if (step === 3 || step === 4) return step;

  return 1;
}

function parseIsoDate(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfTodayUtc() {
  const today = new Date();

  return new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
}

function getDateError(
  value: string,
  options: { label: string; allowPast?: boolean; allowFuture?: boolean },
) {
  if (!value.trim()) return null;

  const parsed = parseIsoDate(value);
  if (!parsed) return `${options.label} must use YYYY-MM-DD.`;

  const today = startOfTodayUtc();
  if (options.allowFuture === false && parsed > today) {
    return `${options.label} cannot be in the future.`;
  }

  if (options.allowPast === false && parsed < today) {
    return `${options.label} cannot be in the past.`;
  }

  return null;
}

function getPartialDateError(
  value: string,
  options: { label: string; allowPast?: boolean; allowFuture?: boolean },
) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parts = trimmed.split("-");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const currentYear = new Date().getFullYear();

  if (
    options.allowFuture === false &&
    year.length === 4 &&
    Number(year) > currentYear
  ) {
    return `${options.label} year cannot be greater than ${currentYear}.`;
  }

  if (month?.length === 2) {
    const monthNumber = Number(month);
    if (monthNumber < 1 || monthNumber > 12) {
      return `${options.label} month must be between 01 and 12.`;
    }
  }

  if (day?.length === 2) {
    const dayNumber = Number(day);
    if (dayNumber < 1 || dayNumber > 31) {
      return `${options.label} day must be between 01 and 31.`;
    }

    if (year.length === 4 && month?.length === 2) {
      const yearNumber = Number(year);
      const monthNumber = Number(month);
      const daysInMonth = new Date(
        Date.UTC(yearNumber, monthNumber, 0),
      ).getUTCDate();

      if (dayNumber > daysInMonth) {
        return `${options.label} day is not valid for this month.`;
      }
    }
  }

  if (trimmed.length === 10) return getDateError(trimmed, options);

  return null;
}

function formatDateInput(value: string, options?: { maxYear?: number }) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let year = digits.slice(0, 4);

  if (options?.maxYear && year.length === 4 && Number(year) > options.maxYear) {
    year = year.slice(0, 3);
  }

  const monthDigits = digits.slice(4);
  let month = monthDigits.slice(0, 2);
  let day = digits.slice(6, 8);

  if (year.length === 4 && /^[2-9]$/.test(monthDigits.slice(0, 1))) {
    month = `0${monthDigits.slice(0, 1)}`;
    day = monthDigits.slice(1, 3);
  }

  if (year.length === 4 && month.length === 2 && /^[4-9]$/.test(day)) {
    day = `0${day}`;
  }

  return [year, month, day].filter(Boolean).join("-");
}

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ hcpId?: string; screen?: string }>();
  const { user } = useSession();
  const routeHcpId = Number(params.hcpId ?? user?.hcp?.id);
  const hcpId = Number.isFinite(routeHcpId) ? routeHcpId : null;
  const [hcpDetails, setHcpDetails] = useState<OnboardingHcpDetails | null>(
    null,
  );
  const [isLoadingHcp, setIsLoadingHcp] = useState(false);
  const [hcpError, setHcpError] = useState<string | null>(null);

  const backendStep = Number(
    hcpDetails?.app_registration_screen ??
      user?.hcp?.app_registration_screen ??
      params.screen ??
      "1",
  );
  const initialStep = normalizeOnboardingStep(backendStep);

  const [activeStep, setActiveStep] = useState<OnboardingStepId>(initialStep);
  const [showPassword, setShowPassword] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({
    firstName: user?.hcp?.first_name ?? "",
    lastName: user?.hcp?.last_name ?? "",
    email: user?.email ?? "",
    contactNumber: user?.hcp?.contact_number ?? "",
    dateOfBirth: user?.hcp?.date_of_birth ?? "",
    gender: user?.hcp?.gender ?? "",
    state: user?.hcp?.state_id ? String(user.hcp.state_id) : "",
    address: user?.hcp?.address ?? "",
    city: user?.hcp?.city_name ?? "",
    suburb: user?.hcp?.suburb_name ?? "",
    postCode: user?.hcp?.post_code ?? "",
    nextOfKin: user?.hcp?.next_of_kin ?? "",
    registrationNumber: user?.hcp?.registration_number ?? "",
    tfnNumber: user?.hcp?.tfn_number ?? "",
    cv: undefined as UploadedFile | undefined,
    aboutMe: user?.hcp?.about_me ?? "",
    password: "",
  });
  const [professionalDocuments, setProfessionalDocuments] =
    useState<DocumentUploadState>({});
  const [mandatoryDocuments, setMandatoryDocuments] =
    useState<DocumentUploadState>({});
  const [preview, setPreview] = useState<{
    title: string;
    file: UploadedFile;
    onRemove: () => void;
  } | null>(null);
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});

  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const activeStepMeta = steps[activeIndex] ?? steps[0];
  const completion = useMemo(() => {
    const completed = Math.max(activeIndex, 0);
    return Math.round((completed / steps.length) * 100);
  }, [activeIndex]);

  useEffect(() => {
    if (!hcpId) return;

    let cancelled = false;
    setIsLoadingHcp(true);
    setHcpError(null);

    getOnboardingHcp(hcpId)
      .then((response) => {
        if (cancelled) return;

        const details = response.data;
        setHcpDetails(details);

        const nextStep = Number(details.app_registration_screen ?? "1");
        setActiveStep(normalizeOnboardingStep(nextStep));

        setPersonalDetails((current) => ({
          ...current,
          firstName: details.first_name ?? "",
          lastName: details.last_name ?? "",
          email: details.email ?? "",
          contactNumber: details.contact_number ?? "",
          dateOfBirth: details.date_of_birth ?? "",
          gender: details.gender ?? "",
          state: details.state?.name ?? "",
          address: details.address ?? "",
          city: details.city_name ?? "",
          suburb: details.suburb_name ?? "",
          postCode: details.post_code ?? "",
          nextOfKin: details.next_of_kin ?? "",
          registrationNumber: details.registration_number ?? "",
          tfnNumber: details.tfn_number ?? "",
          aboutMe: details.about_me ?? "",
        }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setHcpError(
          error instanceof Error
            ? error.message
            : "Could not load onboarding details.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHcp(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hcpId]);

  const setPersonalValue = (
    key: keyof typeof personalDetails,
    value: string | UploadedFile | undefined,
  ) => {
    setPersonalDetails((current) => ({ ...current, [key]: value }));
    if (key === "dateOfBirth") {
      setDateErrors((current) => {
        const next = { ...current };
        const error =
          typeof value === "string"
            ? getPartialDateError(value, {
                label: "Date of birth",
                allowFuture: false,
              })
            : null;

        if (error) {
          next.dateOfBirth = error;
        } else {
          delete next.dateOfBirth;
        }

        return next;
      });
    }
  };

  const handlePickCv = async () => {
    const file = await pickDocument();
    if (!file) return;
    setPersonalValue("cv", {
      name: file.name,
      uri: file.uri,
      mimeType: file.mimeType,
      size: file.size,
    });
  };

  const handlePickDocument = async (
    requirement: DocumentRequirement,
    collection: "professional" | "mandatory",
  ) => {
    const file = await pickDocument();
    if (!file) return;

    const setter =
      collection === "professional"
        ? setProfessionalDocuments
        : setMandatoryDocuments;

    setter((current) => ({
      ...current,
      [requirement.id]: {
        ...current[requirement.id],
        file: {
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
          size: file.size,
        },
      },
    }));
  };

  const setDocumentExpiry = (
    requirement: DocumentRequirement,
    collection: "professional" | "mandatory",
    expiry: string,
  ) => {
    const setter =
      collection === "professional"
        ? setProfessionalDocuments
        : setMandatoryDocuments;

    setter((current) => ({
      ...current,
      [requirement.id]: {
        ...current[requirement.id],
        expiry,
      },
    }));
    setDateErrors((current) => {
      const next = { ...current };
      const key = `${collection}:${requirement.id}`;
      const error = getPartialDateError(expiry, {
        label: `${requirement.name} expiry`,
        allowPast: false,
      });

      if (error) {
        next[key] = error;
      } else {
        delete next[key];
      }

      return next;
    });
  };

  const removeDocument = (
    requirement: DocumentRequirement,
    collection: "professional" | "mandatory",
  ) => {
    const setter =
      collection === "professional"
        ? setProfessionalDocuments
        : setMandatoryDocuments;

    setter((current) => ({
      ...current,
      [requirement.id]: {
        expiry: current[requirement.id]?.expiry,
      },
    }));
    setPreview(null);
  };

  const handleNext = () => {
    const nextDateErrors: Record<string, string> = {};

    if (activeStep === 1) {
      const dateOfBirthError = getDateError(personalDetails.dateOfBirth, {
        label: "Date of birth",
        allowFuture: false,
      });

      if (dateOfBirthError) {
        nextDateErrors.dateOfBirth = dateOfBirthError;
      }
    }

    if (activeStep === 3 || activeStep === 4) {
      const collection = activeStep === 3 ? "professional" : "mandatory";
      const requirements =
        activeStep === 3
          ? professionDocumentRequirements
          : mandatoryDocumentRequirements;
      const values =
        activeStep === 3 ? professionalDocuments : mandatoryDocuments;

      requirements.forEach((requirement) => {
        const expiry = values[requirement.id]?.expiry ?? "";
        const expiryError = requirement.requiresExpiry
          ? getDateError(expiry, {
              label: `${requirement.name} expiry`,
              allowPast: false,
            })
          : null;

        if (expiryError) {
          nextDateErrors[`${collection}:${requirement.id}`] = expiryError;
        }
      });
    }

    if (Object.keys(nextDateErrors).length > 0) {
      setDateErrors(nextDateErrors);
      return;
    }

    const nextStep = steps[activeIndex + 1];

    if (nextStep) {
      setActiveStep(nextStep.id);
      return;
    }

    Alert.alert(
      "Ready for API integration",
      "The onboarding UI is complete. The next pass can connect these values to the backend endpoints.",
    );
  };

  const handleBack = () => {
    const previousStep = steps[activeIndex - 1];

    if (previousStep) {
      setActiveStep(previousStep.id);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.kicker}>Self onboarding</Text>
              <Text style={styles.title}>Complete your registration</Text>
            </View>
            {/* <View style={styles.progressPill}>
            </View> */}
            <Text style={styles.progressPillText}>{completion}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(completion, 8)}%` },
              ]}
            />
          </View>
          {/* <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepper}
          >
            {steps.map((step, index) => {
              const isActive = step.id === activeStep;
              const isComplete = step.id < activeStep;

              return (
                <Pressable
                  key={step.id}
                  onPress={() => setActiveStep(step.id)}
                  style={[
                    styles.stepPill,
                    isActive && styles.stepPillActive,
                    isComplete && styles.stepPillComplete,
                  ]}
                >
                  <View
                    style={[
                      styles.stepIcon,
                      isActive && styles.stepIconActive,
                      isComplete && styles.stepIconComplete,
                    ]}
                  >
                    <Ionicons
                      name={isComplete ? "checkmark" : step.icon}
                      size={16}
                      color={
                        isActive || isComplete ? theme.white : theme.primary
                      }
                    />
                  </View>
                  <View style={styles.stepTextBlock}>
                    <Text
                      style={[
                        styles.stepEyebrow,
                        isActive && styles.stepEyebrowActive,
                      ]}
                    >
                      Step {index + 1}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.stepTitle,
                        isActive && styles.stepTitleActive,
                      ]}
                    >
                      {step.title}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView> */}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 124 },
          ]}
        >
          <View style={styles.heroPanel}>
            <View style={styles.heroIcon}>
              <Ionicons
                name={activeStepMeta.icon}
                size={24}
                color={theme.white}
              />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroEyebrow}>{activeStepMeta.eyebrow}</Text>
              <Text style={styles.heroTitle}>{activeStepMeta.title}</Text>
            </View>
          </View>

          {isLoadingHcp && (
            <View style={styles.noticeBox}>
              <Ionicons name="sync" size={18} color={theme.primary} />
              <Text style={styles.noticeText}>
                Loading your registration...
              </Text>
            </View>
          )}

          {/* {hcpError && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={theme.danger}
              />
              <Text style={styles.errorText}>{hcpError}</Text>
            </View>
          )} */}

          {activeStep === 1 && (
            <View style={styles.formSection}>
              <TwoColumn>
                <Field
                  label="First Name"
                  value={personalDetails.firstName}
                  onChangeText={(value) => setPersonalValue("firstName", value)}
                  styles={styles}
                  theme={theme}
                />
                <Field
                  label="Last Name"
                  value={personalDetails.lastName}
                  onChangeText={(value) => setPersonalValue("lastName", value)}
                  styles={styles}
                  theme={theme}
                />
              </TwoColumn>
              <Field
                label="Email"
                value={personalDetails.email}
                onChangeText={(value) => setPersonalValue("email", value)}
                keyboardType="email-address"
                styles={styles}
                theme={theme}
              />
              <TwoColumn>
                <Field
                  label="Contact Number"
                  value={personalDetails.contactNumber}
                  onChangeText={(value) =>
                    setPersonalValue("contactNumber", value)
                  }
                  keyboardType="phone-pad"
                  styles={styles}
                  theme={theme}
                />
                <Field
                  label="Date of Birth"
                  value={personalDetails.dateOfBirth}
                  onChangeText={(value) =>
                    setPersonalValue(
                      "dateOfBirth",
                      formatDateInput(value, {
                        maxYear: new Date().getFullYear(),
                      }),
                    )
                  }
                  placeholder="YYYY-MM-DD"
                  keyboardType="number-pad"
                  error={dateErrors.dateOfBirth}
                  styles={styles}
                  theme={theme}
                />
              </TwoColumn>
              <OptionGrid
                label="Gender"
                options={genderOptions}
                value={personalDetails.gender}
                onChange={(value) => setPersonalValue("gender", value)}
                variant="radio"
                styles={styles}
              />
              <Field
                label="Password"
                value={personalDetails.password}
                onChangeText={(value) => setPersonalValue("password", value)}
                secureTextEntry={!showPassword}
                rightAccessory={
                  <Pressable onPress={() => setShowPassword((value) => !value)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.secondaryText}
                    />
                  </Pressable>
                }
                styles={styles}
                theme={theme}
              />
              <Field
                label="About Me"
                value={personalDetails.aboutMe}
                onChangeText={(value) => setPersonalValue("aboutMe", value)}
                multiline
                styles={styles}
                theme={theme}
              />
            </View>
          )}

          {activeStep === 2 && (
            <View style={styles.formSection}>
              <DropdownField
                label="Select State"
                options={stateOptions}
                value={personalDetails.state}
                onChange={(value) => setPersonalValue("state", value)}
                styles={styles}
                theme={theme}
              />
              <Field
                label="Address"
                value={personalDetails.address}
                onChangeText={(value) => setPersonalValue("address", value)}
                styles={styles}
                theme={theme}
              />
              <TwoColumn>
                <Field
                  label="City"
                  value={personalDetails.city}
                  onChangeText={(value) => setPersonalValue("city", value)}
                  styles={styles}
                  theme={theme}
                />
                <Field
                  label="Suburb"
                  value={personalDetails.suburb}
                  onChangeText={(value) => setPersonalValue("suburb", value)}
                  styles={styles}
                  theme={theme}
                />
              </TwoColumn>
              <TwoColumn>
                <Field
                  label="Post Code"
                  value={personalDetails.postCode}
                  onChangeText={(value) => setPersonalValue("postCode", value)}
                  keyboardType="number-pad"
                  styles={styles}
                  theme={theme}
                />
                <Field
                  label="Next Of Kin"
                  value={personalDetails.nextOfKin}
                  onChangeText={(value) => setPersonalValue("nextOfKin", value)}
                  styles={styles}
                  theme={theme}
                />
              </TwoColumn>
              <TwoColumn>
                <Field
                  label="Registration Number"
                  value={personalDetails.registrationNumber}
                  onChangeText={(value) =>
                    setPersonalValue("registrationNumber", value)
                  }
                  styles={styles}
                  theme={theme}
                />
                <Field
                  label="TFN Number"
                  value={personalDetails.tfnNumber}
                  onChangeText={(value) => setPersonalValue("tfnNumber", value)}
                  styles={styles}
                  theme={theme}
                />
              </TwoColumn>
              <UploadBox
                label="CV"
                file={personalDetails.cv}
                mandatory={false}
                onPick={handlePickCv}
                onPreview={() => {
                  if (!personalDetails.cv) return;
                  setPreview({
                    title: "CV",
                    file: personalDetails.cv,
                    onRemove: () => {
                      setPersonalValue("cv", undefined);
                      setPreview(null);
                    },
                  });
                }}
                styles={styles}
                theme={theme}
              />
            </View>
          )}

          {activeStep === 3 && (
            <DocumentRequirementList
              collection="professional"
              requirements={professionDocumentRequirements}
              values={professionalDocuments}
              dateErrors={dateErrors}
              onPick={handlePickDocument}
              onExpiryChange={setDocumentExpiry}
              onPreview={(requirement, file) =>
                setPreview({
                  title: requirement.name,
                  file,
                  onRemove: () => removeDocument(requirement, "professional"),
                })
              }
              styles={styles}
              theme={theme}
            />
          )}

          {activeStep === 4 && (
            <DocumentRequirementList
              collection="mandatory"
              requirements={mandatoryDocumentRequirements}
              values={mandatoryDocuments}
              dateErrors={dateErrors}
              onPick={handlePickDocument}
              onExpiryChange={setDocumentExpiry}
              onPreview={(requirement, file) =>
                setPreview({
                  title: requirement.name,
                  file,
                  onRemove: () => removeDocument(requirement, "mandatory"),
                })
              }
              styles={styles}
              theme={theme}
            />
          )}
        </ScrollView>

        <View style={[styles.footer]}>
          {activeStep === 1 ? (
            <View style={styles.stepDotsRow}>
              {steps.map((step) => (
                <View
                  key={step.id}
                  style={[
                    styles.stepDot,
                    step.id === 1 && styles.stepDotActive,
                  ]}
                />
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBack}
            >
              <MaterialCommunityIcons
                name="arrow-left-thin"
                size={24}
                color={theme.primary}
              />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>
              {activeStep === 4 ? "Submit" : "Next"}
            </Text>
            <MaterialCommunityIcons
              name="arrow-right-thin"
              size={24}
              color={theme.white}
            />
          </TouchableOpacity>
        </View>

        <DocumentPreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
          styles={styles}
          theme={theme}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TwoColumn({ children }: { children: React.ReactNode }) {
  return <View style={fieldStyles.twoColumn}>{children}</View>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  rightAccessory,
  error,
  styles,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  secureTextEntry?: boolean;
  multiline?: boolean;
  rightAccessory?: React.ReactNode;
  error?: string;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          multiline && styles.textAreaShell,
          error && styles.inputShellError,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={theme.secondaryText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[styles.input, multiline && styles.textArea]}
          cursorColor={theme.primary}
        />
        {rightAccessory}
      </View>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function DropdownField({
  label,
  options,
  value,
  onChange,
  styles,
  theme,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => setVisible(true)}
        style={styles.dropdownTrigger}
      >
        <Text
          style={[
            styles.dropdownValue,
            !value && { color: theme.secondaryText },
          ]}
        >
          {value || "Select state"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.secondaryText} />
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownSheet}>
            <Text style={styles.dropdownTitle}>{label}</Text>
            {options.map((option) => {
              const selected = option === value;

              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onChange(option);
                    setVisible(false);
                  }}
                  style={[
                    styles.dropdownOption,
                    selected && styles.dropdownOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selected && styles.dropdownOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function OptionGrid({
  label,
  options,
  value,
  onChange,
  variant = "chip",
  styles,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  variant?: "chip" | "radio";
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.optionChip,
                variant === "radio" && styles.radioOption,
                selected && styles.optionChipActive,
                variant === "radio" && selected && styles.radioOptionActive,
              ]}
            >
              {variant === "radio" && (
                <View
                  style={[
                    styles.radioOuter,
                    selected && styles.radioOuterActive,
                  ]}
                >
                  {selected && <View style={styles.radioInner} />}
                </View>
              )}
              <Text
                style={[
                  styles.optionChipText,
                  selected && styles.optionChipTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DocumentRequirementList({
  collection,
  requirements,
  values,
  dateErrors,
  onPick,
  onExpiryChange,
  onPreview,
  styles,
  theme,
}: {
  collection: "professional" | "mandatory";
  requirements: DocumentRequirement[];
  values: DocumentUploadState;
  dateErrors: Record<string, string>;
  onPick: (
    requirement: DocumentRequirement,
    collection: "professional" | "mandatory",
  ) => Promise<void>;
  onExpiryChange: (
    requirement: DocumentRequirement,
    collection: "professional" | "mandatory",
    expiry: string,
  ) => void;
  onPreview: (requirement: DocumentRequirement, file: UploadedFile) => void;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.formSection}>
      {requirements.map((requirement) => {
        const value = values[requirement.id];

        return (
          <View key={requirement.id} style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <View style={styles.documentTitleRow}>
                <View style={styles.documentIcon}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.documentTitleBlock}>
                  <Text style={styles.documentName}>{requirement.name}</Text>
                  <Text style={styles.documentMeta}>
                    {requirement.requiresExpiry
                      ? "Expiry date required"
                      : "No expiry required"}
                  </Text>
                </View>
              </View>
              {/* {requirement.mandatory && (
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryBadgeText}>Mandatory</Text>
                </View>
              )} */}
            </View>
            <UploadBox
              label="File"
              file={value?.file}
              mandatory={requirement.mandatory}
              onPick={() => onPick(requirement, collection)}
              onPreview={() => {
                if (value?.file) onPreview(requirement, value.file);
              }}
              styles={styles}
              theme={theme}
            />
            {requirement.requiresExpiry && (
              <Field
                label="Expiry"
                value={value?.expiry ?? ""}
                onChangeText={(expiry) =>
                  onExpiryChange(
                    requirement,
                    collection,
                    formatDateInput(expiry),
                  )
                }
                placeholder="YYYY-MM-DD"
                keyboardType="number-pad"
                error={
                  values[requirement.id]?.expiry
                    ? dateErrors[`${collection}:${requirement.id}`]
                    : undefined
                }
                styles={styles}
                theme={theme}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function UploadBox({
  label,
  file,
  mandatory,
  onPick,
  onPreview,
  styles,
  theme,
}: {
  label: string;
  file?: UploadedFile;
  mandatory: boolean;
  onPick: () => void;
  onPreview: () => void;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.uploadLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {mandatory && <Text style={styles.requiredText}>Required</Text>}
      </View>
      <Pressable
        onPress={file ? onPreview : onPick}
        style={[styles.uploadBox, file && styles.uploadBoxFilled]}
      >
        <View style={styles.uploadIcon}>
          <Ionicons
            name={file ? "document-attach-outline" : "cloud-upload-outline"}
            size={24}
            color={theme.primary}
          />
        </View>
        <View style={styles.uploadTextBlock}>
          <Text style={styles.uploadTitle} numberOfLines={1}>
            {file?.name ?? "Upload document"}
          </Text>
          <Text style={styles.uploadSubtitle}>
            {file ? "Tap to preview or replace" : "PDF, image, or document"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={file ? onPick : onPick}
          style={styles.uploadAction}
        >
          <Ionicons
            name={file ? "refresh" : "add"}
            size={18}
            color={theme.white}
          />
        </TouchableOpacity>
      </Pressable>
    </View>
  );
}

function DocumentPreviewModal({
  preview,
  onClose,
  styles,
  theme,
}: {
  preview: {
    title: string;
    file: UploadedFile;
    onRemove: () => void;
  } | null;
  onClose: () => void;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  const isImage = preview?.file.mimeType?.startsWith("image/");

  return (
    <Modal
      animationType="slide"
      transparent
      visible={!!preview}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.previewSheet}>
          <View style={styles.previewHandle} />
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewTitle}>{preview?.title}</Text>
              <Text style={styles.previewFileName} numberOfLines={1}>
                {preview?.file.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={20} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          <View style={styles.previewFrame}>
            {preview?.file.uri && isImage ? (
              <Image
                source={{ uri: preview.file.uri }}
                style={styles.previewImage}
                contentFit="contain"
              />
            ) : preview?.file.uri ? (
              <WebView
                source={{ uri: preview.file.uri }}
                style={styles.webView}
              />
            ) : (
              <Text style={styles.previewFallback}>No preview available</Text>
            )}
          </View>
          <View style={styles.previewActions}>
            <TouchableOpacity
              onPress={preview?.onRemove}
              style={styles.removeButton}
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const fieldStyles = StyleSheet.create({
  twoColumn: {
    flexDirection: "row",
    gap: 12,
  },
});

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.safeAreaBg,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 12,
      backgroundColor: theme.whiteBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.greyBorder,
    },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    kicker: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    title: {
      color: theme.primaryText,
      fontSize: 20,
      fontWeight: "700",
      marginTop: 4,
    },
    progressPill: {
      minWidth: 54,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: theme.heroBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    progressPillText: {
      color: theme.primary,
      fontWeight: "800",
      fontSize: 10,
      textTransform: "uppercase",
    },
    progressTrack: {
      height: 5,
      borderRadius: 4,
      backgroundColor: theme.heroBg,
      overflow: "hidden",
      marginTop: 8,
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    stepper: {
      gap: 10,
      paddingTop: 14,
    },
    stepPill: {
      flexDirection: "row",
      alignItems: "center",
      width: 190,
      padding: 10,
      borderRadius: 50,
      backgroundColor: theme.whiteBackground,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      gap: 10,
    },
    stepPillActive: {
      borderColor: theme.primary,
      backgroundColor: theme.heroBg,
    },
    stepPillComplete: {
      borderColor: theme.heroBorder,
    },
    stepIcon: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroBg,
    },
    stepIconActive: {
      backgroundColor: theme.primary,
    },
    stepIconComplete: {
      backgroundColor: theme.primary,
    },
    stepTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    stepEyebrow: {
      color: theme.secondaryText,
      fontSize: 11,
      fontWeight: "700",
    },
    stepEyebrowActive: {
      color: theme.primary,
    },
    stepTitle: {
      color: theme.primaryText,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 2,
    },
    stepTitleActive: {
      color: theme.primaryText,
    },
    content: {
      padding: 10,
      gap: 14,
    },
    heroPanel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 8,
      borderRadius: 5,
      backgroundColor: theme.heroBg,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
    },
    heroText: {
      flex: 1,
    },
    heroEyebrow: {
      color: theme.primary,
      fontWeight: "800",
      fontSize: 9,
      textTransform: "uppercase",
    },
    heroTitle: {
      color: theme.primaryText,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 2,
    },
    stepDotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 2,
    },
    stepDot: {
      width: 16,
      height: 4,
      borderRadius: 4,
      backgroundColor: theme.heroBorder,
    },
    stepDotActive: {
      backgroundColor: theme.primary,
    },
    noticeBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.heroBg,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    noticeText: {
      flex: 1,
      color: theme.primaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.errorBg,
      borderWidth: 1,
      borderColor: theme.danger,
    },
    errorText: {
      flex: 1,
      color: theme.errorTitle,
      fontSize: 13,
      fontWeight: "700",
    },
    formSection: {
      gap: 14,
    },
    field: {
      flex: 1,
      gap: 7,
    },
    fieldLabel: {
      color: theme.primaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    inputShell: {
      minHeight: 42,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      borderRadius: 5,
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inputShellError: {
      borderColor: theme.danger,
    },
    fieldError: {
      color: theme.danger,
      fontSize: 12,
      fontWeight: "700",
    },
    textAreaShell: {
      minHeight: 116,
      paddingVertical: 12,
      alignItems: "flex-start",
    },
    input: {
      flex: 1,
      color: theme.primaryText,
      fontSize: 15,
      minWidth: 0,
    },
    textArea: {
      minHeight: 90,
    },
    dropdownTrigger: {
      minHeight: 42,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      borderRadius: 5,
      backgroundColor: theme.whiteBackground,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    dropdownValue: {
      flex: 1,
      color: theme.primaryText,
      fontSize: 14,
      fontWeight: "600",
    },
    dropdownBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "flex-end",
    },
    dropdownSheet: {
      backgroundColor: theme.whiteBackground,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingHorizontal: 12,
      paddingTop: 18,
      paddingBottom: 24,
      gap: 4,
    },
    dropdownTitle: {
      color: theme.primaryText,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 8,
    },
    dropdownOption: {
      minHeight: 35,
      borderRadius: 5,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    dropdownOptionActive: {
      backgroundColor: theme.heroBg,
    },
    dropdownOptionText: {
      flex: 1,
      color: theme.primaryText,
      fontSize: 14,
      fontWeight: "600",
    },
    dropdownOptionTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    optionChip: {
      minHeight: 42,
      paddingHorizontal: 14,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      backgroundColor: theme.whiteBackground,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    radioOption: {
      justifyContent: "flex-start",
      borderWidth: 0,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
    },
    radioOptionActive: {
      backgroundColor: "transparent",
    },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.grayBorder,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.whiteBackground,
    },
    radioOuterActive: {
      borderColor: theme.primary,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    optionChipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.heroBg,
    },
    optionChipText: {
      color: theme.secondaryText,
      fontWeight: "700",
      fontSize: 13,
    },
    optionChipTextActive: {
      color: theme.primary,
    },
    uploadLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    requiredText: {
      color: theme.danger,
      fontSize: 12,
      fontWeight: "600",
    },
    uploadBox: {
      minHeight: 76,
      borderRadius: 5,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.heroBorder,
      backgroundColor: theme.whiteBackground,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
    },
    uploadBoxFilled: {
      borderStyle: "solid",
      borderColor: theme.primary,
      backgroundColor: theme.heroBg,
    },
    uploadIcon: {
      width: 44,
      height: 44,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroBg,
    },
    uploadTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    uploadTitle: {
      color: theme.primaryText,
      fontWeight: "800",
      fontSize: 14,
    },
    uploadSubtitle: {
      color: theme.secondaryText,
      fontSize: 12,
      marginTop: 3,
    },
    uploadAction: {
      width: 34,
      height: 34,
      borderRadius: 3,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
    },
    documentCard: {
      gap: 14,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      backgroundColor: theme.whiteBackground,
      padding: 10,
    },
    documentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    documentTitleRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    documentIcon: {
      width: 40,
      height: 40,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroBg,
    },
    documentTitleBlock: {
      flex: 1,
      minWidth: 0,
    },
    documentName: {
      color: theme.primaryText,
      fontSize: 15,
      fontWeight: "800",
    },
    documentMeta: {
      color: theme.secondaryText,
      fontSize: 12,
      marginTop: 3,
    },
    mandatoryBadge: {
      minHeight: 20,
      paddingHorizontal: 8,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroIconBg,
    },
    mandatoryBadgeText: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: "600",
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 10,
      paddingTop: 14,
      backgroundColor: theme.whiteBackground,
    },
    primaryButton: {
      borderRadius: 50,
      height: 35,
      paddingHorizontal: 20,
      paddingVertical: 4,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      backgroundColor: theme.primary,
    },
    primaryButtonText: {
      color: theme.white,
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryButton: {
      borderRadius: 50,
      height: 35,
      paddingHorizontal: 20,
      paddingVertical: 4,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      backgroundColor: theme.heroBg,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: "700",
    },
    hidden: {
      opacity: 0,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.42)",
      justifyContent: "flex-end",
    },
    previewSheet: {
      maxHeight: "86%",
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      backgroundColor: theme.whiteBackground,
      padding: 16,
      gap: 14,
    },
    previewHandle: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.grayBorder,
    },
    previewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    previewTitle: {
      color: theme.primaryText,
      fontSize: 18,
      fontWeight: "800",
    },
    previewFileName: {
      color: theme.secondaryText,
      fontSize: 12,
      marginTop: 3,
      maxWidth: 260,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroBg,
    },
    previewFrame: {
      height: 390,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.greyBorder,
      overflow: "hidden",
      backgroundColor: theme.heroBg,
      alignItems: "center",
      justifyContent: "center",
    },
    previewImage: {
      width: "100%",
      height: "100%",
    },
    webView: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.whiteBackground,
    },
    previewFallback: {
      color: theme.secondaryText,
      fontWeight: "700",
    },
    previewActions: {
      flexDirection: "row",
      gap: 12,
    },
    removeButton: {
      minHeight: 48,
      minWidth: 124,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.danger,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    removeButtonText: {
      color: theme.danger,
      fontSize: 14,
      fontWeight: "800",
    },
    doneButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 8,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    doneButtonText: {
      color: theme.white,
      fontSize: 14,
      fontWeight: "800",
    },
  });
