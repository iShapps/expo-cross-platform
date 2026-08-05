import {
  City,
  getOnboardingHcp,
  getStates,
  State,
  submitPersonalDetails,
  submitProfessionalDetails,
  uploadDocument,
} from "@/api-queries/onboarding";
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import { Colors } from "@/constants/theme";
import { RegistrationStatusResponse } from "@/data-types/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getRegistrationStatus,
  resolveOnboardingStep,
  TokenStorage,
} from "@/utils/auth-api";
import { pickDocument } from "@/utils/file-pickers";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import GooglePlacesTextInput from "react-native-google-places-textinput";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useSession } from "./ctx";

type OnboardingStepId = 1 | 2 | 3 | 4 | 5;

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
    title: "Personal details",
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
    title: "Professional details",
    eyebrow: "Credentials",
    icon: "briefcase-outline",
  },
  {
    id: 4,
    title: "Professional documents",
    eyebrow: "Documents",
    icon: "document-text-outline",
  },
  {
    id: 5,
    title: "Mandatory documents",
    eyebrow: "Compliance",
    icon: "shield-checkmark-outline",
  },
];

const genderOptions = ["Male", "Female", "Other"];

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
  const { user, updateHcp, signOut } = useSession();
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const routeHcpId = Number(params.hcpId ?? user?.hcp?.id);
  const hcpId = Number.isFinite(routeHcpId) ? routeHcpId : null;
  const [isLoadingHcp, setIsLoadingHcp] = useState(false);
  // Registration status API is the sole source of truth for step + documents.
  // Keep isCheckingStatus=true until that API resolves so no stale step flashes.
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<
    RegistrationStatusResponse["data"] | null
  >(null);

  const [activeStep, setActiveStep] = useState<OnboardingStepId>(1);
  const [personalDetails, setPersonalDetails] = useState({
    firstName: user?.hcp?.first_name ?? "",
    lastName: user?.hcp?.last_name ?? "",
    email: user?.email ?? "",
    contactNumber: user?.hcp?.contact_number ?? "",
    dateOfBirth: user?.hcp?.date_of_birth ?? "",
    gender: user?.hcp?.gender ?? "",
    stateName: "",
    stateId: user?.hcp?.state_id ?? (null as number | null),
    cityId: null as number | null,
    address: user?.hcp?.address ?? "",
    latitude: user?.hcp?.latitude ?? "",
    longitude: user?.hcp?.longitude ?? "",
    city: user?.hcp?.city_name ?? "",
    suburb: user?.hcp?.suburb_name ?? "",
    postCode: user?.hcp?.post_code ?? "",
    nextOfKin: user?.hcp?.next_of_kin ?? "",
    aboutMe: user?.hcp?.about_me ?? "",
    maximumDistance: user?.hcp?.maximum_distance
      ? String(user.hcp.maximum_distance)
      : "",
    acceptLowerLevelJob: (user?.hcp?.accept_lower_level_job ?? 0) === 1,
  });
  const [professionalDetails, setProfessionalDetails] = useState({
    tfnNumber: user?.hcp?.tfn_number ?? "",
    registrationNumber: user?.hcp?.registration_number ?? "",
    abn_number: user?.hcp?.abn_number ?? "",
    cv: undefined as UploadedFile | undefined,
  });
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);

  const professionDocumentRequirements = useMemo<DocumentRequirement[]>(() => {
    if (!registrationStatus) return [];
    return registrationStatus.missing_documents.profession.map((item) => ({
      id: String(item.document.id),
      name: item.document.name,
      mandatory: item.document.mandatory_status === "yes",
      requiresExpiry: item.document.expiry_date_mandatory === "yes",
    }));
  }, [registrationStatus]);

  const mandatoryDocumentRequirements = useMemo<DocumentRequirement[]>(() => {
    if (!registrationStatus) return [];
    return registrationStatus.missing_documents.general.map((doc) => ({
      id: String(doc.id),
      name: doc.name,
      mandatory: doc.mandatory_status === "yes",
      requiresExpiry: doc.expiry_date_mandatory === "yes",
    }));
  }, [registrationStatus]);

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
  const [showSuccess, setShowSuccess] = useState(false);

  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const activeStepMeta = steps[activeIndex] ?? steps[0];
  const completion = useMemo(() => {
    const completed = Math.max(activeIndex, 0);
    return Math.round((completed / steps.length) * 100);
  }, [activeIndex]);

  // Keep a stable ref to updateHcp so Effect 1 can call the latest version
  // without listing it as a dependency (which would restart the effect on every user-store write and cause an infinite loop).
  const updateHcpRef = useRef(updateHcp);
  useEffect(() => {
    updateHcpRef.current = updateHcp;
  }, [updateHcp]);

  // Single source of truth for "fetch status -> update local state".
  // Every call site goes through here so setRegistrationStatus is never skipped.
  // Returns the fresh data so callers can derive the next step from it.
  const refreshStatus = React.useCallback(async () => {
    const token = await TokenStorage.getToken();
    if (!token) return null;
    const status = await getRegistrationStatus(token).catch(() => null);
    if (!status) return null;
    setRegistrationStatus(status.data);
    updateHcpRef.current({
      app_registration_screen: String(resolveOnboardingStep(status.data)),
    });
    return status.data;
  }, []);

  // Effect 1: Registration status is sole source of truth for the current step.
  // Runs exactly once on mount. Independent of the HCP data fetch so a failure in either does not block the other.
  useEffect(() => {
    let cancelled = false;

    TokenStorage.getToken()
      .then((token) => {
        if (cancelled || !token) return null;
        return getRegistrationStatus(token);
      })
      .then((statusResponse) => {
        if (cancelled || !statusResponse) return;
        // Registration fully done — leave onboarding and go to the main app.
        if (statusResponse.data.steps.registration_complete) {
          updateHcpRef.current({ app_registration_screen: "0" });
          router.replace("/(tabs)");
          return;
        }
        setRegistrationStatus(statusResponse.data);
        const step = resolveOnboardingStep(statusResponse.data);
        setActiveStep(step);
        updateHcpRef.current({ app_registration_screen: String(step) });
      })
      .catch(() => {
        // Network failure
      })
      .finally(() => {
        if (!cancelled) setIsCheckingStatus(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Effect 2: HCP data -> used only to prefill form fields.
  useEffect(() => {
    if (!hcpId) return;

    let cancelled = false;
    setIsLoadingHcp(true);

    getOnboardingHcp(hcpId)
      .then((response) => {
        if (cancelled) return;

        const details = response.data;

        setPersonalDetails((current) => ({
          ...current,
          firstName: details.first_name ?? "",
          lastName: details.last_name ?? "",
          email: details.email ?? "",
          contactNumber: details.contact_number ?? "",
          dateOfBirth: details.date_of_birth ?? "",
          gender: details.gender ?? "",
          stateName: details.state?.name ?? "",
          stateId: details.state?.id ?? null,
          address: details.address ?? "",
          city: details.city_name ?? "",
          suburb: details.suburb_name ?? "",
          postCode: details.post_code ?? "",
          nextOfKin: details.next_of_kin ?? "",
          aboutMe: details.about_me ?? "",
        }));
        setProfessionalDetails((current) => ({
          ...current,
          tfnNumber: details.tfn_number ?? "",
          registrationNumber: details.registration_number ?? "",
          abn_number: details.abn_number ?? "",
        }));
      })
      .catch(() => {
        // Prefill fails silently — user fills manually
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHcp(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hcpId]);

  useEffect(() => {
    setIsLoadingStates(true);
    setStatesError(null);
    getStates()
      .then((res) => setStates(res.data.states))
      .catch((err: unknown) =>
        setStatesError(
          err instanceof Error ? err.message : "Could not load states.",
        ),
      )
      .finally(() => setIsLoadingStates(false));
  }, []);

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
    setProfessionalDetails((curr) => ({
      ...curr,
      cv: {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        size: file.size,
      },
    }));
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

  const handleNext = async () => {
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

    if (activeStep === 4 || activeStep === 5) {
      const collection = activeStep === 4 ? "professional" : "mandatory";
      const requirements =
        activeStep === 4
          ? professionDocumentRequirements
          : mandatoryDocumentRequirements;
      const values =
        activeStep === 4 ? professionalDocuments : mandatoryDocuments;

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

    if (activeStep === 2) {
      if (!personalDetails.stateId) {
        Alert.alert("Missing field", "Please select a state.");
        return;
      }

      setIsSubmittingStep(true);

      const personalPayload = {
        first_name: personalDetails.firstName,
        last_name: personalDetails.lastName,
        gender: personalDetails.gender.toLowerCase(),
        country: 1,
        state: personalDetails.stateId,
        address: "123 Test Street, Sydney NSW 2000",
        latitude: "-33.8688",
        longitude: "151.2093",
        contact_number: personalDetails.contactNumber,
        date_of_birth: personalDetails.dateOfBirth,
        city: personalDetails.city,
        suburb: personalDetails.suburb,
        post_code: personalDetails.postCode,
        about_me: personalDetails.aboutMe,
        maximum_distance: Number(personalDetails.maximumDistance) || 0,
        accept_lower_level_job: (personalDetails.acceptLowerLevelJob
          ? 1
          : 0) as 0 | 1,
      };
      console.log(
        "[ONB] Step 2 personal details payload:",
        JSON.stringify(personalPayload, null, 2),
      );

      try {
        const personalResult = await submitPersonalDetails(personalPayload);
        updateHcp(personalResult.data);
        await refreshStatus();
        setActiveStep(3);
      } catch (err) {
        console.log("[ONB_ERROR]", err);
        Alert.alert(
          "Error",
          err instanceof Error
            ? err.message
            : "Failed to save personal details.",
        );
      } finally {
        setIsSubmittingStep(false);
      }
      return;
    }

    if (activeStep === 3) {
      setIsSubmittingStep(true);

      const professionalPayload = {
        tfn_number: professionalDetails.tfnNumber,
        abn_number: professionalDetails.abn_number,
        registration_number: professionalDetails.registrationNumber,
        cv: professionalDetails.cv
          ? {
              name: professionalDetails.cv.name,
              uri: professionalDetails.cv.uri,
              mimeType: professionalDetails.cv.mimeType,
            }
          : undefined,
      };
      console.log(
        "[ONB] Step 3 professional details payload:",
        JSON.stringify(professionalPayload, null, 2),
      );

      try {
        const profResult = await submitProfessionalDetails(professionalPayload);
        updateHcp(profResult.data);
        const freshData = await refreshStatus();
        setActiveStep(freshData ? resolveOnboardingStep(freshData) : 4);
      } catch (err) {
        Alert.alert(
          "Error",
          err instanceof Error
            ? err.message
            : "Failed to save professional details.",
        );
      } finally {
        setIsSubmittingStep(false);
      }
      return;
    }

    if (activeStep === 4 || activeStep === 5) {
      const requirements =
        activeStep === 4
          ? professionDocumentRequirements
          : mandatoryDocumentRequirements;
      const values =
        activeStep === 4 ? professionalDocuments : mandatoryDocuments;

      const missing = requirements.filter(
        (r) => r.mandatory && !values[r.id]?.file,
      );
      if (missing.length > 0) {
        Alert.alert(
          "Missing documents",
          `Please upload: ${missing.map((r) => r.name).join(", ")}`,
        );
        return;
      }

      const toUpload = requirements.filter((r) => values[r.id]?.file);

      const docPayloads = toUpload.map((r) => ({
        document_id: Number(r.id),
        document_name: r.name,
        file: values[r.id]!.file!.name,
        expiry_date: r.requiresExpiry ? values[r.id]?.expiry : undefined,
      }));
      console.log(
        `[ONB] Step ${activeStep} document upload payloads:`,
        JSON.stringify(docPayloads, null, 2),
      );

      setIsSubmittingStep(true);

      try {
        await Promise.all(
          toUpload.map((requirement) =>
            uploadDocument({
              document_id: Number(requirement.id),
              file: values[requirement.id]!.file!,
              expiry_date: requirement.requiresExpiry
                ? values[requirement.id]?.expiry
                : undefined,
            }),
          ),
        );

        await refreshStatus();
        const nextStep = steps[activeIndex + 1];
        if (nextStep) {
          setActiveStep(nextStep.id);
        } else {
          setShowSuccess(true);
        }
      } catch (err) {
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Failed to upload documents.",
        );
      } finally {
        setIsSubmittingStep(false);
      }
      return;
    }

    const nextStep = steps[activeIndex + 1];

    if (nextStep) {
      setActiveStep(nextStep.id);
    }
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
                label="About Me"
                value={personalDetails.aboutMe}
                onChangeText={(value) => setPersonalValue("aboutMe", value)}
                multiline
                styles={styles}
                theme={theme}
              />
              <Field
                label="Maximum Distance (km)"
                value={personalDetails.maximumDistance}
                onChangeText={(value) =>
                  setPersonalValue("maximumDistance", value)
                }
                keyboardType="number-pad"
                placeholder="e.g. 50"
                styles={styles}
                theme={theme}
              />
              <OptionGrid
                label="Accept Lower Level Job"
                options={["Yes", "No"]}
                value={personalDetails.acceptLowerLevelJob ? "Yes" : "No"}
                onChange={(value) =>
                  setPersonalDetails((curr) => ({
                    ...curr,
                    acceptLowerLevelJob: value === "Yes",
                  }))
                }
                variant="radio"
                styles={styles}
              />
            </View>
          )}

          {activeStep === 2 && (
            <View style={styles.formSection}>
              {isLoadingStates && (
                <View style={styles.noticeBox}>
                  <Ionicons name="sync" size={18} color={theme.primary} />
                  <Text style={styles.noticeText}>Loading states...</Text>
                </View>
              )}
              {statesError && (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={theme.danger}
                  />
                  <Text style={styles.errorText}>{statesError}</Text>
                </View>
              )}
              <DropdownField
                label="Select State"
                options={states}
                value={personalDetails.stateName}
                onChange={(id, name) => {
                  const selected = states.find((s) => s.id === id);
                  setCities(selected?.cities ?? []);
                  setPersonalDetails((curr) => ({
                    ...curr,
                    stateId: id,
                    stateName: name,
                    city: "",
                    cityId: null,
                  }));
                }}
                styles={styles}
                theme={theme}
              />
              <DropdownField
                label="Select City"
                options={cities}
                value={personalDetails.city}
                placeholder={
                  personalDetails.stateId
                    ? "No cities available"
                    : "Select a state first"
                }
                disabled={cities.length === 0}
                onChange={(id, name) =>
                  setPersonalDetails((curr) => ({
                    ...curr,
                    cityId: id,
                    city: name,
                  }))
                }
                styles={styles}
                theme={theme}
              />
              <AddressAutocomplete
                value={personalDetails.address}
                onSelect={({
                  address,
                  latitude,
                  longitude,
                  city,
                  suburb,
                  postCode,
                }) =>
                  setPersonalDetails((curr) => ({
                    ...curr,
                    address,
                    latitude,
                    longitude,
                    city: city || curr.city,
                    suburb: suburb || curr.suburb,
                    postCode: postCode || curr.postCode,
                  }))
                }
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
            </View>
          )}

          {activeStep === 3 && (
            <View style={styles.formSection}>
              <Field
                label="Tax File Number"
                value={professionalDetails.tfnNumber}
                onChangeText={(v) =>
                  setProfessionalDetails((c) => ({ ...c, tfnNumber: v }))
                }
                keyboardType="number-pad"
                styles={styles}
                theme={theme}
              />
              <Field
                label="Passport Number"
                value={professionalDetails.registrationNumber}
                onChangeText={(v) =>
                  setProfessionalDetails((c) => ({
                    ...c,
                    registrationNumber: v,
                  }))
                }
                styles={styles}
                theme={theme}
              />
              {/* <Field
                label="ABN Number"
                value={professionalDetails.abn_number}
                onChangeText={(v) =>
                  setProfessionalDetails((c) => ({
                    ...c,
                    abn_number: v,
                  }))
                }
                styles={styles}
                theme={theme}
              /> */}
              <UploadBox
                label="CV"
                file={professionalDetails.cv}
                mandatory={false}
                onPick={handlePickCv}
                onPreview={() => {
                  if (!professionalDetails.cv) return;
                  setPreview({
                    title: "CV",
                    file: professionalDetails.cv,
                    onRemove: () => {
                      setProfessionalDetails((c) => ({ ...c, cv: undefined }));
                      setPreview(null);
                    },
                  });
                }}
                styles={styles}
                theme={theme}
              />
            </View>
          )}

          {activeStep === 4 && (
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

          {activeStep === 5 && (
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
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isSubmittingStep || isCheckingStatus) && { opacity: 0.7 },
            ]}
            onPress={() => void handleNext()}
            disabled={isSubmittingStep || isCheckingStatus}
          >
            {isSubmittingStep || isCheckingStatus ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {activeStep === 5 ? "Submit" : "Next"}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right-thin"
                  size={24}
                  color={theme.white}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        <DocumentPreviewModal
          visible={!!preview}
          title={preview?.title ?? "Preview"}
          file={preview?.file ?? null}
          onClose={() => setPreview(null)}
          actions={
            preview
              ? [
                  {
                    key: "remove",
                    label: "Remove",
                    icon: "trash-outline",
                    variant: "danger",
                    onPress: preview.onRemove,
                  },
                ]
              : []
          }
        />
      </KeyboardAvoidingView>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <ConfettiCannon
            count={200}
            origin={{ x: screenWidth / 2, y: -20 }}
            autoStart
            fadeOut
            fallSpeed={3000}
            explosionSpeed={350}
            colors={["#70C601", "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1"]}
          />
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Welcome to iShapps!</Text>
            <Text style={styles.successBody}>
              Your registration is complete. Your account is pending approval —
              you will be notified once it has been reviewed.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 8 }]}
              onPress={() => {
                void signOut().then(() => {
                  router.replace("/(open)/login");
                });
              }}
            >
              <Text style={styles.primaryButtonText}>Get started</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: screenHeight * 0.1 }} />
        </View>
      </Modal>

      <SnakeBorderLoader visible={isLoadingHcp} />
    </SafeAreaView>
  );
}

function SnakeBorderLoader({ visible }: { visible: boolean }) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: 5,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [visible, progress]);

  if (!visible) return null;

  const T = 3;
  const COLOR = "#70C601";

  // Left side: bottom to top (progress 0–1 grow, 1–2 shrink)
  const leftTop = progress.interpolate({
    inputRange: [0, 1, 2, 5],
    outputRange: [height, 0, 0, 0],
  });
  const leftHeight = progress.interpolate({
    inputRange: [0, 1, 2, 5],
    outputRange: [0, height, 0, 0],
  });

  // Top side: left to right (progress 1–2 grow, 2–3 shrink)
  const topLeft = progress.interpolate({
    inputRange: [0, 1, 2, 3, 5],
    outputRange: [0, 0, 0, width, width],
  });
  const topWidth = progress.interpolate({
    inputRange: [0, 1, 2, 3, 5],
    outputRange: [0, 0, width, 0, 0],
  });

  // Right side: top to bottom (progress 2–3 grow, 3–4 shrink)
  const rightTop = progress.interpolate({
    inputRange: [0, 2, 3, 4, 5],
    outputRange: [0, 0, 0, height, height],
  });
  const rightHeight = progress.interpolate({
    inputRange: [0, 2, 3, 4, 5],
    outputRange: [0, 0, height, 0, 0],
  });

  // Bottom side: right to left (progress 3–4 grow, 4–5 shrink)
  const bottomRight = progress.interpolate({
    inputRange: [0, 3, 4, 5],
    outputRange: [0, 0, 0, width],
  });
  const bottomWidth = progress.interpolate({
    inputRange: [0, 3, 4, 5],
    outputRange: [0, 0, width, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: leftTop,
          width: T,
          height: leftHeight,
          backgroundColor: COLOR,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: topLeft,
          height: T,
          width: topWidth,
          backgroundColor: COLOR,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          right: 0,
          top: rightTop,
          width: T,
          height: rightHeight,
          backgroundColor: COLOR,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          right: bottomRight,
          height: T,
          width: bottomWidth,
          backgroundColor: COLOR,
        }}
      />
    </View>
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

function AddressAutocomplete({
  value,
  onSelect,
  styles,
  theme,
}: {
  value: string;
  onSelect: (result: {
    address: string;
    latitude: string;
    longitude: string;
    city: string;
    suburb: string;
    postCode: string;
  }) => void;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  const PLACES_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
    "AIzaSyCo1TDkkMMkqguKpLYzOrL9GM4GUjlUA_s";

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Address</Text>
      <GooglePlacesTextInput
        apiKey={PLACES_KEY}
        fetchDetails={true}
        detailsFields={["formattedAddress", "location", "addressComponents"]}
        onPlaceSelect={(place) => {
          const details = place.details as {
            formattedAddress?: string;
            location?: { latitude: number; longitude: number };
            addressComponents?: {
              longText: string;
              types: string[];
            }[];
          } | null;

          console.log("[PLACE_DETAILS]", details);
          console.log(JSON.stringify(details?.addressComponents, null, 2));
          const get = (type: string) =>
            details?.addressComponents?.find((c) => c.types.includes(type))
              ?.longText ?? "";
          onSelect({
            address: details?.formattedAddress ?? "",
            latitude: details?.location
              ? String(details.location.latitude)
              : "",
            longitude: details?.location
              ? String(details.location.longitude)
              : "",
            suburb:
              get("sublocality_level_1") ||
              get("sublocality") ||
              get("neighborhood") ||
              get("locality"),

            city: get("locality") || get("administrative_area_level_2"),
            postCode: get("postal_code"),
          });
        }}
        includedRegionCodes={["AU"]}
        nestedScrollEnabled={true}
        hideOnKeyboardDismiss={true}
        debounceDelay={400}
        value={value}
        placeHolderText="Start typing your address..."
        minCharsToFetch={2}
        autoCapitalize="words"
        autoCorrect={false}
        keyboardType="default"
        returnKeyType="search"
        textContentType="streetAddressLine1"
        style={{
          container: {
            width: "100%",
          },
          inputContainer: {
            minHeight: 42,
            borderWidth: 1,
            borderColor: theme.greyBorder,
            borderRadius: 5,
            backgroundColor: theme.whiteBackground,
            paddingHorizontal: 10,
          },
          input: {
            color: theme.primaryText,
            fontSize: 12,
          },
          suggestionsContainer: {
            backgroundColor: theme.whiteBackground,
            borderWidth: 1,
            borderColor: theme.greyBorder,
            borderRadius: 5,
            marginTop: 4,
            maxHeight: 250,
            overflow: "hidden",
          },
          suggestionItem: {
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.greyBorder,
          },
          suggestionText: {
            main: {
              fontSize: 14,
              color: theme.primaryText,
            },
            secondary: {
              fontSize: 12,
              color: theme.secondaryText,
            },
          },
          loadingIndicator: {
            color: theme.secondaryText,
          },
          placeholder: {
            color: theme.secondaryText,
          },
        }}
      />
    </View>
  );
}

function DropdownField({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  styles,
  theme,
}: {
  label: string;
  options: { id: number; name: string }[];
  value: string;
  onChange: (id: number, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setVisible(true)}
        style={[styles.dropdownTrigger, disabled && { opacity: 0.5 }]}
      >
        <Text
          style={[
            styles.dropdownValue,
            !value && { color: theme.secondaryText },
          ]}
        >
          {value || placeholder || `Select ${label.toLowerCase()}`}
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
              const selected = option.name === value;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    onChange(option.id, option.name);
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
                    {option.name}
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
    successOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    successCard: {
      backgroundColor: theme.whiteBackground,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      width: "100%",
      gap: 12,
    },
    successEmoji: {
      fontSize: 56,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.primaryText,
      textAlign: "center",
    },
    successBody: {
      fontSize: 14,
      color: theme.secondaryText,
      textAlign: "center",
      lineHeight: 22,
    },
    statusCheckLoader: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    statusCheckLoaderText: {
      color: theme.secondaryText,
      fontSize: 14,
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
    suggestionList: {
      borderWidth: 1,
      borderColor: theme.greyBorder,
      borderRadius: 8,
      marginTop: 4,
      backgroundColor: theme.whiteBackground,
      overflow: "hidden",
    },
    suggestionItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.greyBorder,
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      color: theme.primaryText,
    },
  });
