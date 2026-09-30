import { logApiErrorToSentry } from "@/api-actions/error-utils";
import {
  City,
  getOnboardingHcp,
  getStates,
  OnboardingQueryError,
  State,
  submitPersonalDetails,
  submitProfessionalDetails,
  uploadDocument,
} from "@/api-queries/onboarding";
import { AppButton, AppText, Icon, IconBadge } from "@/components/design";
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import {
  elevation,
  FontFamily,
  Radius,
  Space,
  Touch,
  Type,
  type AppColors,
} from "@/constants/design";
import { RegistrationStatusResponse } from "@/data-types/auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  getRegistrationStatus,
  resolveOnboardingStep,
  TokenStorage,
} from "@/utils/auth-api";
import { FileTooLargeError } from "@/utils/compress-file";
import { pickDocument } from "@/utils/file-pickers";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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

function parseOnboardingStep(value?: string): OnboardingStepId {
  const parsed = Number(value);
  return parsed >= 1 && parsed <= 5 ? (parsed as OnboardingStepId) : 1;
}

type UploadedFile = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

let cachedCv: UploadedFile | undefined;

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
    title: "Mandatory documents",
    eyebrow: "Compliance",
    icon: "shield-checkmark-outline",
  },
  {
    id: 5,
    title: "Professional documents",
    eyebrow: "Documents",
    icon: "document-text-outline",
  },
];

const PROFESSIONAL_DETAILS_STEP_ENABLED = false;
const visibleSteps = PROFESSIONAL_DETAILS_STEP_ENABLED
  ? steps
  : steps.filter((step) => step.id !== 3);

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
  const { colors: theme, isDark } = useAppTheme();
  const styles = getStyles(theme, isDark);
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

  const buildPersonalDetails = () => ({
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
  const buildProfessionalDetails = (cv: UploadedFile | undefined) => ({
    tfnNumber: user?.hcp?.tfn_number ?? "",
    registrationNumber: user?.hcp?.registration_number ?? "",
    abn_number: user?.hcp?.abn_number ?? "",
    cv,
  });

  const [activeStep, setActiveStep] = useState<OnboardingStepId>(() =>
    parseOnboardingStep(params.screen),
  );
  const [personalDetails, setPersonalDetails] = useState(buildPersonalDetails);
  const [professionalDetails, setProfessionalDetails] = useState(() =>
    buildProfessionalDetails(cachedCv),
  );
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);

  const professionDocumentRequirements = useMemo<DocumentRequirement[]>(() => {
    if (!registrationStatus) return [];
    return registrationStatus.missing_documents.profession.map((doc) => ({
      id: String(doc.document_id),
      name: doc.name,
      mandatory: doc.mandatory_status === "yes",
      requiresExpiry: doc.expiry_date_mandatory === "yes",
    }));
  }, [registrationStatus]);

  const mandatoryDocumentRequirements = useMemo<DocumentRequirement[]>(() => {
    if (!registrationStatus) return [];
    return registrationStatus.missing_documents.general.map((doc) => ({
      id: String(doc.document_id),
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

  const previousHcpIdRef = useRef(hcpId);
  useEffect(() => {
    if (previousHcpIdRef.current === hcpId) return;
    previousHcpIdRef.current = hcpId;

    cachedCv = undefined;
    setActiveStep(parseOnboardingStep(params.screen));
    setPersonalDetails(buildPersonalDetails());
    setProfessionalDetails(buildProfessionalDetails(undefined));
    setProfessionalDocuments({});
    setMandatoryDocuments({});
    setDateErrors({});
    setRegistrationStatus(null);
    setIsCheckingStatus(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hcpId]);

  const activeIndex = visibleSteps.findIndex((step) => step.id === activeStep);
  const activeStepMeta = visibleSteps[activeIndex] ?? visibleSteps[0];

  // Fades/slides the step content in on every step change, forward or back.
  const stepAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeStep, stepAnim]);
  const stepAnimStyle = {
    opacity: stepAnim,
    transform: [
      {
        translateY: stepAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  // Keep a stable ref to updateHcp so Effect 1 can call the latest version
  const updateHcpRef = useRef(updateHcp);
  useEffect(() => {
    updateHcpRef.current = updateHcp;
  }, [updateHcp]);

  const signOutRef = useRef(signOut);
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  const refreshStatus = React.useCallback(async () => {
    const token = await TokenStorage.getToken();
    if (!token || !hcpId) return null;
    const status = await getRegistrationStatus(token, hcpId).catch(() => null);
    if (!status) return null;

    if (status.data.steps.registration_complete) {
      updateHcpRef.current({ app_registration_screen: "0" });
      void signOutRef.current().then(() => {
        router.replace("/(open)/login");
      });
      return null;
    }

    setRegistrationStatus(status.data);
    updateHcpRef.current({
      app_registration_screen: String(resolveOnboardingStep(status.data)),
    });
    return status.data;
  }, [router, hcpId]);

  useEffect(() => {
    let cancelled = false;

    TokenStorage.getToken()
      .then((token) => {
        if (cancelled || !token || !hcpId) return null;
        return getRegistrationStatus(token, hcpId);
      })
      .then((statusResponse) => {
        if (cancelled || !statusResponse) return;
        // Registration fully done via some other path (e.g. an admin
        // finishing document upload while the user was still on this
        // screen) — sign out and force a fresh login
        if (statusResponse.data.steps.registration_complete) {
          updateHcpRef.current({ app_registration_screen: "0" });
          void signOutRef.current().then(() => {
            router.replace("/(open)/login");
          });
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
  }, [router, hcpId]);

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
          firstName: current.firstName || details.first_name || "",
          lastName: current.lastName || details.last_name || "",
          email: current.email || details.email || "",
          contactNumber: current.contactNumber || details.contact_number || "",
          dateOfBirth: current.dateOfBirth || details.date_of_birth || "",
          gender: current.gender || details.gender || "",
          stateName: current.stateName || details.state?.name || "",
          stateId: current.stateId ?? details.state?.id ?? null,
          address: current.address || details.address || "",
          city: current.city || details.city_name || "",
          suburb: current.suburb || details.suburb_name || "",
          postCode: current.postCode || details.post_code || "",
          nextOfKin: current.nextOfKin || details.next_of_kin || "",
          aboutMe: current.aboutMe || details.about_me || "",
        }));
        setProfessionalDetails((current) => ({
          ...current,
          tfnNumber: current.tfnNumber || details.tfn_number || "",
          registrationNumber:
            current.registrationNumber || details.registration_number || "",
          abn_number: current.abn_number || details.abn_number || "",
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
    let file;
    try {
      file = await pickDocument();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof FileTooLargeError
          ? err.message
          : "Could not open the file picker. Please try again.",
      );
      return;
    }
    if (!file) return;
    const picked: UploadedFile = {
      name: file.name,
      uri: file.uri,
      mimeType: file.mimeType,
      size: file.size,
    };
    cachedCv = picked;
    setProfessionalDetails((curr) => ({ ...curr, cv: picked }));
  };

  const handlePickDocument = async (
    requirement: DocumentRequirement,
    collection: "professional" | "mandatory",
  ) => {
    let file;
    try {
      file = await pickDocument();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof FileTooLargeError
          ? err.message
          : "Could not open the file picker. Please try again.",
      );
      return;
    }
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
    setDateErrors((current) => {
      const key = `${collection}:${requirement.id}:file`;
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
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
      const key = `${collection}:${requirement.id}:expiry`;
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
      if (
        !personalDetails.firstName.trim() ||
        !personalDetails.lastName.trim() ||
        !personalDetails.contactNumber.trim() ||
        !personalDetails.gender.trim() ||
        !personalDetails.dateOfBirth.trim()
      ) {
        Alert.alert(
          "Missing field",
          "Please fill in your first name, last name, contact number, date of birth, and gender.",
        );
        return;
      }

      const dateOfBirthError = getDateError(personalDetails.dateOfBirth, {
        label: "Date of birth",
        allowFuture: false,
      });

      if (dateOfBirthError) {
        nextDateErrors.dateOfBirth = dateOfBirthError;
      }
    }

    if (activeStep === 3) {
      const tfn = professionalDetails.tfnNumber.trim();
      if (tfn && tfn.length !== 9) {
        nextDateErrors.tfnNumber = "Tax File Number must be 9 digits.";
      }
    }

    if (activeStep === 4 || activeStep === 5) {
      const collection = activeStep === 4 ? "mandatory" : "professional";
      const requirements =
        activeStep === 4
          ? mandatoryDocumentRequirements
          : professionDocumentRequirements;
      const values =
        activeStep === 4 ? mandatoryDocuments : professionalDocuments;

      requirements.forEach((requirement) => {
        const hasFile = !!values[requirement.id]?.file;

        if (requirement.mandatory && !hasFile) {
          nextDateErrors[
            `${collection}:${requirement.id}:file`
          ] = `${requirement.name} is required.`;
        }

        if (!requirement.requiresExpiry) return;

        const expiry = values[requirement.id]?.expiry ?? "";

        if (!expiry.trim()) {
          if (hasFile || requirement.mandatory) {
            nextDateErrors[
              `${collection}:${requirement.id}:expiry`
            ] = `${requirement.name} expiry is required.`;
          }
          return;
        }

        const expiryError = getDateError(expiry, {
          label: `${requirement.name} expiry`,
          allowPast: false,
        });

        if (expiryError) {
          nextDateErrors[`${collection}:${requirement.id}:expiry`] =
            expiryError;
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

      if (
        !personalDetails.address.trim() ||
        !personalDetails.latitude ||
        !personalDetails.longitude ||
        !personalDetails.postCode.trim()
      ) {
        Alert.alert(
          "Missing field",
          "Please select your address from the suggestions.",
        );
        return;
      }

      setIsSubmittingStep(true);

      const personalPayload = {
        first_name: personalDetails.firstName,
        last_name: personalDetails.lastName,
        gender: personalDetails.gender.toLowerCase(),
        country: 1,
        state_id: personalDetails.stateId,
        address: personalDetails.address,
        latitude: personalDetails.latitude,
        longitude: personalDetails.longitude,
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

      if (!hcpId) {
        Alert.alert("Error", "Missing HCP profile. Please sign in again.");
        setIsSubmittingStep(false);
        void signOut().then(() => {
          router.replace("/(open)/login");
        });
        return;
      }

      try {
        const personalResult = await submitPersonalDetails(
          hcpId,
          personalPayload,
        );
        updateHcp(personalResult.data);
        const freshData = await refreshStatus();
        setActiveStep(freshData ? resolveOnboardingStep(freshData) : 4);
      } catch (err) {
        console.log("[ONB_ERROR]", err);
        logApiErrorToSentry(err, {
          endpoint: "/registration/personal-details",
          method: "PATCH",
        });
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
        cachedCv = undefined;
        const freshData = await refreshStatus();
        setActiveStep(freshData ? resolveOnboardingStep(freshData) : 4);
      } catch (err) {
        logApiErrorToSentry(err, {
          endpoint: "/registration/professional-details",
          method: "PATCH",
        });
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
          ? mandatoryDocumentRequirements
          : professionDocumentRequirements;
      const values =
        activeStep === 4 ? mandatoryDocuments : professionalDocuments;

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

      if (!hcpId) {
        Alert.alert("Error", "Missing HCP profile. Please sign in again.");
        void signOut().then(() => {
          router.replace("/(open)/login");
        });
        return;
      }

      setIsSubmittingStep(true);

      try {
        for (const requirement of toUpload) {
          console.log(
            `[ONB] Uploading document_id=${requirement.id} (${requirement.name})…`,
          );
          try {
            await uploadDocument(hcpId, {
              document_id: Number(requirement.id),
              file: values[requirement.id]!.file!,
              expiry_date: requirement.requiresExpiry
                ? values[requirement.id]?.expiry
                : undefined,
            });
            console.log(
              `[ONB] Uploaded document_id=${requirement.id} (${requirement.name}) OK`,
            );
          } catch (uploadErr) {
            console.log(
              `[ONB] FAILED document_id=${requirement.id} (${requirement.name}):`,
              uploadErr instanceof OnboardingQueryError
                ? JSON.stringify(
                    {
                      message: uploadErr.message,
                      statusCode: uploadErr.statusCode,
                      details: uploadErr.details,
                    },
                    null,
                    2,
                  )
                : uploadErr,
            );
            throw uploadErr;
          }
        }

        await refreshStatus();
        const nextStep = visibleSteps[activeIndex + 1];
        if (nextStep) {
          setActiveStep(nextStep.id);
        } else {
          setShowSuccess(true);
        }
      } catch (err) {
        logApiErrorToSentry(err, {
          endpoint: "/registration/documents",
          method: "POST",
        });
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Failed to upload documents.",
        );
      } finally {
        setIsSubmittingStep(false);
      }
      return;
    }

    const nextStep = visibleSteps[activeIndex + 1];

    if (nextStep) {
      setActiveStep(nextStep.id);
    }
  };

  const handleBack = () => {
    const previousStep = visibleSteps[activeIndex - 1];

    if (previousStep) {
      setActiveStep(previousStep.id);
    }
  };

  const isBusy = isSubmittingStep || isCheckingStatus;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.flex}>
              <AppText variant="overline" color="primaryStrong">
                Self onboarding
              </AppText>
              <AppText variant="title2">Complete your registration</AppText>
            </View>
            <View style={styles.progressPill}>
              <AppText variant="caption" color="primaryStrong">
                Step {activeIndex + 1} of {visibleSteps.length}
              </AppText>
            </View>
          </View>
          <View style={styles.stepTrackerRow}>
            {visibleSteps.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.stepSegment,
                  index < activeIndex && styles.stepSegmentDone,
                  index === activeIndex && styles.stepSegmentActive,
                ]}
              />
            ))}
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
          <Animated.View style={[styles.stepAnimatedContent, stepAnimStyle]}>
            <View style={styles.heroPanel}>
              <IconBadge icon={activeStepMeta.icon} tone="primary" size={52} />
              <View style={styles.flex}>
                <AppText variant="overline" color="textTertiary">
                  {activeStepMeta.eyebrow}
                </AppText>
                <AppText variant="title3">{activeStepMeta.title}</AppText>
              </View>
            </View>

            {activeStep === 1 && (
              <View style={styles.formCard}>
                <TwoColumn>
                  <Field
                    label="First Name"
                    value={personalDetails.firstName}
                    onChangeText={(value) =>
                      setPersonalValue("firstName", value)
                    }
                    styles={styles}
                    theme={theme}
                  />
                  <Field
                    label="Last Name"
                    value={personalDetails.lastName}
                    onChangeText={(value) =>
                      setPersonalValue("lastName", value)
                    }
                    styles={styles}
                    theme={theme}
                  />
                </TwoColumn>
                <Field
                  label="Email"
                  value={personalDetails.email}
                  onChangeText={(value) => setPersonalValue("email", value)}
                  keyboardType="email-address"
                  editable={false}
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
                  value={
                    personalDetails.gender.slice(0, 1).toUpperCase() +
                    personalDetails.gender.slice(1).toLowerCase()
                  }
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
              </View>
            )}

            {activeStep === 2 && (
              <View style={styles.formCard}>
                {isLoadingStates && (
                  <View style={styles.noticeBox}>
                    <Icon name="sync" size={18} color={theme.primaryStrong} />
                    <AppText variant="footnote" color="primaryStrong">
                      Loading states...
                    </AppText>
                  </View>
                )}
                {statesError && (
                  <View style={styles.errorBox}>
                    <Icon
                      name="alert-circle-outline"
                      size={18}
                      color={theme.danger}
                    />
                    <AppText variant="footnote" color="danger" style={styles.flex}>
                      {statesError}
                    </AppText>
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
                <Field
                  label="Post Code"
                  value={personalDetails.postCode}
                  onChangeText={(value) => setPersonalValue("postCode", value)}
                  keyboardType="number-pad"
                  styles={styles}
                  theme={theme}
                />
              </View>
            )}

            {activeStep === 3 && (
              <View style={styles.formCard}>
                <Field
                  label="Tax File Number"
                  value={professionalDetails.tfnNumber}
                  onChangeText={(v) =>
                    setProfessionalDetails((c) => ({
                      ...c,
                      tfnNumber: v.replace(/\D/g, "").slice(0, 9),
                    }))
                  }
                  keyboardType="number-pad"
                  maxLength={9}
                  error={dateErrors.tfnNumber}
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
                        cachedCv = undefined;
                        setProfessionalDetails((c) => ({
                          ...c,
                          cv: undefined,
                        }));
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

            {activeStep === 5 && (
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
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {activeStep === 1 ? (
            <View style={styles.stepDotsRow}>
              {visibleSteps.map((step) => (
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
            <AppButton
              title="Back"
              variant="outline"
              icon="arrow-back"
              onPress={() => {
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                handleBack();
              }}
              style={styles.footerButton}
            />
          )}
          <AppButton
            title={activeStep === 5 ? "Submit" : "Next"}
            icon={activeStep === 5 ? "checkmark" : "arrow-forward"}
            iconPosition="right"
            loading={isBusy}
            disabled={isBusy}
            onPress={() => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              void handleNext();
            }}
            style={styles.footerButton}
          />
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
            <IconBadge icon="sparkles-outline" tone="primary" size={80} />
            <AppText variant="title2" align="center">
              Welcome to iShapps Workforce!
            </AppText>
            <AppText variant="callout" color="textSecondary" align="center">
              Your registration is complete. Your account is pending approval —
              you will be notified once it has been reviewed.
            </AppText>
            <AppButton
              title="Get started"
              icon="arrow-forward"
              iconPosition="right"
              fullWidth
              style={styles.successButton}
              onPress={() => {
                void signOut().then(() => {
                  router.replace("/(open)/login");
                });
              }}
            />
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
  editable,
  maxLength,
  required,
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
  editable?: boolean;
  maxLength?: number;
  required?: boolean;
  styles: ReturnType<typeof getStyles>;
  theme: AppColors;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputShellFocused,
          multiline && styles.textAreaShell,
          error && styles.inputShellError,
          editable === false && styles.inputShellDisabled,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={theme.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          maxLength={maxLength}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            styles.input,
            multiline && styles.textArea,
            editable === false && { color: theme.textSecondary },
          ]}
          cursorColor={theme.primary}
          selectionColor={theme.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
  theme: AppColors;
}) {
  const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

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
            minHeight: Touch.button,
            borderWidth: 1.5,
            borderColor: theme.surfaceMuted,
            borderRadius: Radius.md,
            backgroundColor: theme.surfaceMuted,
            paddingHorizontal: Space.md,
          },
          input: {
            color: theme.text,
            fontFamily: FontFamily.regular,
            fontSize: 16,
          },
          suggestionsContainer: {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: Radius.md,
            marginTop: Space.xxs,
            maxHeight: 250,
            overflow: "hidden",
          },
          suggestionItem: {
            paddingHorizontal: Space.md,
            paddingVertical: Space.sm,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
          },
          suggestionText: {
            main: {
              fontFamily: FontFamily.medium,
              fontSize: 15,
              color: theme.text,
            },
            secondary: {
              fontFamily: FontFamily.regular,
              fontSize: 13,
              color: theme.textSecondary,
            },
          },
          loadingIndicator: {
            color: theme.textSecondary,
          },
          placeholder: {
            color: theme.textTertiary,
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
  theme: AppColors;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setVisible(true)}
        accessibilityRole="button"
        style={[styles.inputShell, styles.dropdownTrigger, disabled && { opacity: 0.5 }]}
      >
        <Text
          style={[
            styles.dropdownValue,
            !value && { color: theme.textTertiary },
          ]}
          numberOfLines={1}
        >
          {value || placeholder || `Select ${label.toLowerCase()}`}
        </Text>
        <Icon name="chevron-down" size={18} color={theme.textTertiary} />
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
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={theme.primaryStrong}
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
              accessibilityRole={variant === "radio" ? "radio" : "button"}
              accessibilityState={{ selected, checked: selected }}
              style={[
                styles.optionChip,
                variant === "radio" && styles.radioOption,
                selected && styles.optionChipActive,
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
  theme: AppColors;
}) {
  return (
    <View style={styles.formSection}>
      {requirements.map((requirement) => {
        const value = values[requirement.id];

        return (
          <View key={requirement.id} style={styles.documentCard}>
            <View style={styles.documentTitleRow}>
              <IconBadge
                icon={value?.file ? "checkmark-done-outline" : "document-text-outline"}
                tone={value?.file ? "success" : "neutral"}
                size={40}
              />
              <View style={styles.flex}>
                <Text style={styles.documentName}>{requirement.name}</Text>
                <Text style={styles.documentMeta}>
                  {requirement.requiresExpiry
                    ? "Expiry date required"
                    : "No expiry required"}
                </Text>
              </View>
            </View>
            <UploadBox
              label="File"
              file={value?.file}
              mandatory={requirement.mandatory}
              onPick={() => onPick(requirement, collection)}
              onPreview={() => {
                if (value?.file) onPreview(requirement, value.file);
              }}
              error={dateErrors[`${collection}:${requirement.id}:file`]}
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
                error={dateErrors[`${collection}:${requirement.id}:expiry`]}
                required
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
  error,
  styles,
  theme,
}: {
  label: string;
  file?: UploadedFile;
  mandatory: boolean;
  onPick: () => void;
  onPreview: () => void;
  error?: string;
  styles: ReturnType<typeof getStyles>;
  theme: AppColors;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {mandatory && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <Pressable
        onPress={file ? onPreview : onPick}
        accessibilityRole="button"
        style={[
          styles.uploadBox,
          file && styles.uploadBoxFilled,
          error && styles.uploadBoxError,
        ]}
      >
        <IconBadge
          icon={file ? "document-attach-outline" : "cloud-upload-outline"}
          tone="primary"
          size={44}
        />
        <View style={styles.flex}>
          <Text style={styles.uploadTitle} numberOfLines={1}>
            {file?.name ?? "Upload document"}
          </Text>
          <Text style={styles.uploadSubtitle}>
            {file ? "Tap to preview or replace" : "PDF, image, or document"}
          </Text>
        </View>
        <Pressable
          onPress={file ? onPick : onPick}
          accessibilityRole="button"
          accessibilityLabel={file ? "Replace file" : "Choose file"}
          hitSlop={6}
          style={styles.uploadAction}
        >
          <Icon
            name={file ? "refresh" : "add"}
            size={20}
            color={theme.textOnPrimary}
          />
        </Pressable>
      </Pressable>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  twoColumn: {
    flexDirection: "row",
    gap: 12,
  },
});

const getStyles = (theme: AppColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },

    // Header
    header: {
      paddingHorizontal: Space.gutter,
      paddingTop: Space.sm,
      paddingBottom: Space.md,
      gap: Space.md,
      backgroundColor: theme.background,
      zIndex: 1,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Space.sm,
    },
    progressPill: {
      paddingHorizontal: Space.sm,
      paddingVertical: 6,
      borderRadius: Radius.full,
      backgroundColor: theme.primarySoft,
    },
    stepTrackerRow: {
      flexDirection: "row",
      gap: 6,
    },
    stepSegment: {
      flex: 1,
      height: 6,
      borderRadius: Radius.full,
      backgroundColor: theme.surfaceSunken,
    },
    stepSegmentDone: {
      backgroundColor: theme.primary,
    },
    stepSegmentActive: {
      backgroundColor: theme.primary,
      opacity: 0.55,
    },

    // Content
    content: {
      paddingHorizontal: Space.gutter,
      paddingTop: Space.xs,
      gap: Space.md,
      flexGrow: 1,
    },
    stepAnimatedContent: {
      gap: Space.md,
    },
    heroPanel: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.sm,
      paddingVertical: Space.xs,
    },
    formCard: {
      gap: Space.md,
      padding: Space.lg,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      ...elevation(theme, isDark, 1),
    },
    formSection: {
      gap: Space.md,
    },
    noticeBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.xs,
      padding: Space.sm,
      borderRadius: Radius.sm,
      backgroundColor: theme.primarySoft,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.xs,
      padding: Space.sm,
      borderRadius: Radius.sm,
      backgroundColor: theme.dangerSoft,
    },

    // Fields
    field: {
      flex: 1,
      gap: Space.xs,
    },
    fieldLabel: {
      ...Type.subhead,
      color: theme.text,
    },
    requiredAsterisk: {
      color: theme.danger,
    },
    inputShell: {
      minHeight: Touch.button,
      flexDirection: "row",
      alignItems: "center",
      gap: Space.xs,
      borderWidth: 1.5,
      borderColor: theme.surfaceMuted,
      borderRadius: Radius.md,
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: Space.md,
    },
    inputShellFocused: {
      borderColor: theme.primary,
      backgroundColor: theme.surface,
    },
    inputShellError: {
      borderColor: theme.danger,
    },
    inputShellDisabled: {
      opacity: 0.7,
    },
    textAreaShell: {
      minHeight: 112,
      alignItems: "flex-start",
      paddingVertical: Space.sm,
    },
    input: {
      flex: 1,
      alignSelf: "stretch",
      fontFamily: FontFamily.regular,
      fontSize: 16,
      color: theme.text,
      paddingVertical: 0,
    },
    textArea: {
      minHeight: 88,
    },
    fieldError: {
      ...Type.footnote,
      color: theme.danger,
    },

    // Dropdown
    dropdownTrigger: {
      justifyContent: "space-between",
    },
    dropdownValue: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: 16,
      color: theme.text,
    },
    dropdownBackdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      padding: Space.gutter,
    },
    dropdownSheet: {
      maxHeight: "70%",
      backgroundColor: theme.surface,
      borderRadius: Radius.xxl,
      padding: Space.md,
      gap: Space.xs,
    },
    dropdownTitle: {
      ...Type.title3,
      color: theme.text,
      paddingHorizontal: Space.xs,
      paddingVertical: Space.xs,
    },
    dropdownOption: {
      minHeight: Touch.min + 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Space.sm,
      borderRadius: Radius.md,
    },
    dropdownOptionActive: {
      backgroundColor: theme.primarySoft,
    },
    dropdownOptionText: {
      ...Type.body,
      color: theme.text,
    },
    dropdownOptionTextActive: {
      fontFamily: FontFamily.semibold,
      color: theme.primaryStrong,
    },

    // Options (gender)
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Space.xs,
    },
    optionChip: {
      minHeight: Touch.min,
      flexDirection: "row",
      alignItems: "center",
      gap: Space.xs,
      paddingHorizontal: Space.md,
      borderRadius: Radius.full,
      borderWidth: 1.5,
      borderColor: theme.surfaceMuted,
      backgroundColor: theme.surfaceMuted,
    },
    radioOption: {
      paddingLeft: Space.sm,
    },
    optionChipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    optionChipText: {
      ...Type.subhead,
      color: theme.textSecondary,
    },
    optionChipTextActive: {
      color: theme.primaryStrong,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: Radius.full,
      borderWidth: 2,
      borderColor: theme.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterActive: {
      borderColor: theme.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: Radius.full,
      backgroundColor: theme.primary,
    },

    // Documents
    documentCard: {
      gap: Space.md,
      padding: Space.lg,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      ...elevation(theme, isDark, 1),
    },
    documentTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.sm,
    },
    documentName: {
      ...Type.headline,
      color: theme.text,
    },
    documentMeta: {
      ...Type.footnote,
      color: theme.textSecondary,
    },
    uploadBox: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      gap: Space.sm,
      padding: Space.sm,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: theme.borderStrong,
      backgroundColor: theme.surfaceMuted,
    },
    uploadBoxFilled: {
      borderStyle: "solid",
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    uploadBoxError: {
      borderColor: theme.danger,
    },
    uploadTitle: {
      ...Type.subhead,
      color: theme.text,
    },
    uploadSubtitle: {
      ...Type.caption,
      color: theme.textSecondary,
    },
    uploadAction: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
    },

    // Footer
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Space.sm,
      paddingHorizontal: Space.gutter,
      paddingTop: Space.sm,
      paddingBottom: Space.sm,
      backgroundColor: theme.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    footerButton: {
      flex: 1,
    },
    stepDotsRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: Radius.full,
      backgroundColor: theme.surfaceSunken,
    },
    stepDotActive: {
      width: 24,
      backgroundColor: theme.primary,
    },

    // Success
    successOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: Space.xl,
    },
    successCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: theme.surface,
      borderRadius: Radius.xxl,
      padding: Space.xl,
      paddingTop: Space.xxl,
      alignItems: "center",
      gap: Space.sm,
    },
    successButton: {
      marginTop: Space.sm,
    },
  });

