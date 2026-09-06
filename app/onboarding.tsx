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
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import { Colors, Radii } from "@/constants/theme";
import { RegistrationStatusResponse } from "@/data-types/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getRegistrationStatus,
  resolveOnboardingStep,
  TokenStorage,
} from "@/utils/auth-api";
import { pickDocument } from "@/utils/file-pickers";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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

const TEXT_SAFE_PRIMARY = "#3D7A00";
const TEXT_SAFE_DANGER = "#C93C2E";

const SURFACE_TINT = "#F2F9E9";
const SURFACE_TINT_DEEP = "#E6F3D4";
const ACCENT_BORDER = "#CFE8A8";
const UPLOAD_BOX_BG = "#F5F5F5";

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
    const file = await pickDocument();
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
          endpoint: "/v2/registration/personal-details",
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
          endpoint: "/v2/registration/professional-details",
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
          endpoint: "/v2/registration/documents",
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
            <Text style={styles.progressPillText}>
              Step {activeIndex + 1} of {visibleSteps.length}
            </Text>
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
              <View style={styles.formSection}>
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

        <View style={[styles.footer]}>
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
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                Platform.OS === "ios" && pressed && { opacity: 0.6 },
              ]}
              android_ripple={{ color: theme.heroBorder }}
              onPress={() => {
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                handleBack();
              }}
            >
              <MaterialCommunityIcons
                name="arrow-left-thin"
                size={24}
                color={TEXT_SAFE_PRIMARY}
              />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (isSubmittingStep || isCheckingStatus) && { opacity: 0.7 },
              Platform.OS === "ios" &&
                pressed &&
                !(isSubmittingStep || isCheckingStatus) && { opacity: 0.85 },
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.25)" }}
            onPress={() => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              void handleNext();
            }}
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
          </Pressable>
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
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <View
        style={[
          styles.inputShell,
          multiline && styles.textAreaShell,
          error && styles.inputShellError,
          editable === false && { opacity: 0.6 },
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
          editable={editable}
          maxLength={maxLength}
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
            minHeight: 42,
            borderWidth: 1,
            borderColor: theme.greyBorder,
            borderRadius: Radii.sm,
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
            borderRadius: Radii.sm,
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
                    color={theme.secondaryText}
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
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {mandatory && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <Pressable
        onPress={file ? onPreview : onPick}
        style={[
          styles.uploadBox,
          file && styles.uploadBoxFilled,
          error && styles.uploadBoxError,
        ]}
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

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor: theme.whiteBackground,
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
      borderRadius: Radii.lg,
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

      borderBottomWidth: 2,
      borderBottomColor: ACCENT_BORDER,
      zIndex: 1,
    },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    kicker: {
      color: TEXT_SAFE_PRIMARY,
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
      borderRadius: Radii.full,
      backgroundColor: theme.heroBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    progressPillText: {
      color: TEXT_SAFE_PRIMARY,
      fontWeight: "800",
      fontSize: 10,
      textTransform: "uppercase",
    },
    stepTrackerRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 10,
    },
    stepSegment: {
      flex: 1,
      height: 5,
      borderRadius: Radii.xs,

      backgroundColor: SURFACE_TINT_DEEP,
    },
    stepSegmentDone: {
      backgroundColor: theme.primary,
    },
    stepSegmentActive: {
      backgroundColor: theme.primary,
      opacity: 0.55,
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
      borderRadius: Radii.full,
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
      borderRadius: Radii.sm,
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
      flexGrow: 1,
      backgroundColor: SURFACE_TINT,
    },
    stepAnimatedContent: {
      gap: 14,
    },
    heroPanel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 8,
      borderRadius: Radii.md,
      backgroundColor: theme.heroBg,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: Radii.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
    },
    heroText: {
      flex: 1,
    },
    heroEyebrow: {
      color: TEXT_SAFE_PRIMARY,
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
      borderRadius: Radii.full,
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
      borderRadius: Radii.sm,
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
      borderRadius: Radii.sm,
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
      borderColor: ACCENT_BORDER,
      borderRadius: Radii.sm,
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
      color: TEXT_SAFE_DANGER,
      fontSize: 12,
      fontWeight: "700",
    },
    requiredAsterisk: {
      color: TEXT_SAFE_DANGER,
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
      borderColor: ACCENT_BORDER,
      borderRadius: Radii.sm,
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
      borderTopLeftRadius: Radii.lg,
      borderTopRightRadius: Radii.lg,
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
      borderRadius: Radii.sm,
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
      color: TEXT_SAFE_PRIMARY,
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
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: ACCENT_BORDER,
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
      borderRadius: Radii.full,
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
      borderRadius: Radii.full,
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
      color: TEXT_SAFE_PRIMARY,
    },
    uploadBox: {
      minHeight: 76,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.heroBorder,
      backgroundColor: UPLOAD_BOX_BG,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
    },
    uploadBoxFilled: {
      borderStyle: "solid",
      borderColor: theme.primary,
      backgroundColor: UPLOAD_BOX_BG,
    },
    uploadBoxError: {
      borderColor: theme.danger,
    },
    uploadIcon: {
      width: 44,
      height: 44,
      borderRadius: Radii.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroBg,
    },
    uploadTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    uploadTitle: {
      color: "#666666",
      fontWeight: "800",
      fontSize: 14,
    },
    uploadSubtitle: {
      color: "#666666",
      fontSize: 12,
      marginTop: 3,
    },
    uploadAction: {
      width: 34,
      height: 34,
      borderRadius: Radii.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
    },
    documentCard: {
      gap: 14,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: ACCENT_BORDER,
      backgroundColor: theme.whiteBackground,
      padding: 10,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: {
          elevation: 2,
        },
      }),
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
      borderRadius: Radii.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.greyBorder,
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
      borderRadius: Radii.full,
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
      borderTopWidth: 1,
      borderTopColor: ACCENT_BORDER,
    },
    primaryButton: {
      borderRadius: Radii.md,
      height: Platform.OS === "ios" ? 44 : 48,
      minWidth: Platform.OS === "ios" ? undefined : 64,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      backgroundColor: theme.primary,
      overflow: "hidden",
      ...(Platform.OS === "android" ? { elevation: 2 } : null),
    },
    primaryButtonText: {
      color: theme.white,
      fontSize: 15,
      fontWeight: Platform.OS === "ios" ? "600" : "700",
    },
    secondaryButton: {
      borderRadius: Radii.md,
      height: Platform.OS === "ios" ? 44 : 48,
      minWidth: Platform.OS === "ios" ? undefined : 64,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      backgroundColor: theme.heroBg,
      borderWidth: 1,
      borderColor: theme.heroBorder,
      overflow: "hidden",
    },
    secondaryButtonText: {
      color: TEXT_SAFE_PRIMARY,
      fontSize: 15,
      fontWeight: Platform.OS === "ios" ? "600" : "700",
    },
    hidden: {
      opacity: 0,
    },
    suggestionList: {
      borderWidth: 1,
      borderColor: theme.greyBorder,
      borderRadius: Radii.sm,
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
