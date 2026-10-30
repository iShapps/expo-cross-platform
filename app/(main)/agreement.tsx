import {
  AGREEMENTS_QUERY_KEY,
  type AgreementDetail,
  getAgreement,
  giveSigningConsent,
  markAgreementViewed,
  signAgreement,
} from "@/api-queries/agreements";
import {
  AppButton,
  AppSwitch,
  AppText,
  Card,
  Chip,
  EmptyState,
  ScreenHeader,
  TextField,
} from "@/components/design";
import { SignaturePad, type Stroke } from "@/components/signature-pad";
import { Radius, Space } from "@/constants/design";
import { useProfileData } from "@/data-store/use-account-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMediumDate } from "@/utils/date-time";
import { error as logError } from "@/utils/logger";
import { PdfView } from "@kishannareshpal/expo-pdf";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { Directory, File, Paths } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * One agreement: read the PDF in the app (to the last page), agree to sign
 * electronically the first time, then type your name and sign with your
 * finger. Once signed, the signed record (certificate) can be opened here.
 */
export default function AgreementScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const agreementId = Number(id);
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agreement", agreementId],
    queryFn: () => getAgreement(agreementId),
    enabled: Number.isFinite(agreementId) && agreementId > 0,
    staleTime: 60 * 1000,
  });
  const agreement = query.data;

  const [localPdf, setLocalPdf] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const viewedSent = useRef(false);

  // Opening it counts as viewed (once).
  useEffect(() => {
    if (agreement && agreement.status === "pending" && !viewedSent.current) {
      viewedSent.current = true;
      markAgreementViewed(agreement.id)
        .then(() => queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY }))
        .catch(() => undefined);
    }
  }, [agreement, queryClient]);

  // PdfView reads local files only: download the signed link to the cache first.
  useEffect(() => {
    if (!agreement?.document_url) return;
    let cancelled = false;
    setLocalPdf(null);
    setPdfError(null);
    (async () => {
      try {
        const folder = new Directory(Paths.cache, "agreements");
        folder.create({ intermediates: true, idempotent: true });
        const target = new File(folder, `agreement-${agreement.id}-v${agreement.version}.pdf`);
        if (target.exists) target.delete();
        const downloaded = await File.downloadFileAsync(agreement.document_url, target, { idempotent: true });
        if (!cancelled) setLocalPdf(downloaded.uri);
      } catch (e) {
        logError("Agreement PDF download failed:", e);
        if (!cancelled) setPdfError("The document didn't download. Check your connection and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agreement?.document_url, agreement?.id, agreement?.version]);

  if (query.isLoading) {
    return (
      <Screen title="Agreement">
        <ActivityIndicator style={{ marginTop: Space.xxl }} color={colors.primary} />
      </Screen>
    );
  }

  if (!agreement) {
    return (
      <Screen title="Agreement">
        <EmptyState
          icon="alert-circle-outline"
          tone="danger"
          title="This agreement isn't available"
          message={query.error instanceof Error ? query.error.message : undefined}
          actionLabel="Back to agreements"
          onAction={() => router.replace("/(main)/agreements")}
        />
      </Screen>
    );
  }

  const signed = agreement.status === "signed";

  return (
    <Screen title={agreement.title}>
      <View style={styles.meta}>
        <Chip label={agreement.kind === "contract" ? "Contract" : "Policy"} tone="blue" />
        <Chip label={`Version ${agreement.version}`} />
        {signed ? (
          <Chip label={`Signed ${agreement.signed_at ? formatMediumDate(agreement.signed_at) : ""}`} tone="success" icon="checkmark-circle-outline" />
        ) : (
          <Chip label="To sign" tone="warning" />
        )}
      </View>
      {!!agreement.description && (
        <AppText variant="footnote" color="textSecondary" style={styles.description}>
          {agreement.description}
        </AppText>
      )}

      <View style={[styles.viewer, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
        {pdfError ? (
          <EmptyState icon="cloud-offline-outline" tone="danger" title="Couldn't open the document" message={pdfError}
            actionLabel="Try again" onAction={() => query.refetch()} />
        ) : localPdf ? (
          <PdfView
            uri={localPdf}
            style={StyleSheet.absoluteFill}
            onLoadComplete={({ pageCount }) => pageCount <= 1 && setReachedEnd(true)}
            onPageChanged={({ pageIndex, pageCount }) => pageIndex >= pageCount - 1 && setReachedEnd(true)}
            onError={({ message }) => setPdfError(message || "The document couldn't be shown.")}
          />
        ) : (
          <ActivityIndicator style={{ marginTop: Space.xxl }} color={colors.primary} />
        )}
      </View>

      <View style={[styles.footer, { borderColor: colors.border, backgroundColor: colors.background }]}>
        {signed ? (
          <AppButton
            title={agreement.kind === "contract" ? "View my signed contract" : "View my signed record"}
            icon="ribbon-outline"
            variant="outline"
            fullWidth
            disabled={!agreement.certificate_url}
            onPress={() => agreement.certificate_url && Linking.openURL(agreement.certificate_url)}
          />
        ) : (
          <>
            {!reachedEnd && (
              <AppText variant="footnote" color="textSecondary" align="center">
                Read to the last page to sign.
              </AppText>
            )}
            <AppButton title="Sign" icon="create-outline" fullWidth disabled={!reachedEnd} onPress={() => setSignOpen(true)} />
          </>
        )}
      </View>

      <SignSheet
        visible={signOpen}
        agreement={agreement}
        onClose={() => setSignOpen(false)}
        onSigned={(updated) => {
          setSignOpen(false);
          queryClient.setQueryData(["agreement", agreementId], updated);
          queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
        }}
      />
    </Screen>
  );
}

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title={title} onBack={() => router.back()} />
      {children}
    </SafeAreaView>
  );
}

/** Consent (first time), then typed name + drawn signature + "I've read it". */
function SignSheet({
  visible,
  agreement,
  onClose,
  onSigned,
}: {
  visible: boolean;
  agreement: AgreementDetail;
  onClose: () => void;
  onSigned: (updated: AgreementDetail) => void;
}) {
  const { colors } = useAppTheme();
  const profileName = useProfileData((state) => state.userDetails?.name) ?? "";
  const [consented, setConsented] = useState(agreement.consent.given);
  const [name, setName] = useState(profileName);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [pad, setPad] = useState({ width: 0, height: 0 });
  const [confirmRead, setConfirmRead] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (visible) {
      setConsented(agreement.consent.given);
      setProblem(null);
    }
  }, [visible, agreement.consent.given]);

  const agree = async () => {
    setBusy(true);
    setProblem(null);
    try {
      await giveSigningConsent();
      setConsented(true);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "That didn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const points = strokes.reduce((n, s) => n + s.length, 0);
  const canSign = name.trim().length >= 2 && points >= 5 && confirmRead && !busy;

  const sign = async () => {
    setBusy(true);
    setProblem(null);
    try {
      const updated = await signAgreement(agreement.id, {
        signer_name: name.trim(),
        strokes,
        pad,
        confirm_read: true,
        device: {
          platform: Platform.OS,
          model: Device.modelName ?? undefined,
          os_version: Device.osVersion ?? undefined,
          app_version: Application.nativeApplicationVersion ?? undefined,
        },
      });
      onSigned(updated);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "It wasn't signed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={busy ? undefined : onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" scrollEnabled={!drawing}>
            <AppText variant="title3">{consented ? `Sign ${agreement.title}` : "Signing electronically"}</AppText>

            {!consented ? (
              <>
                <Card padding={Space.md}>
                  <AppText variant="callout">{agreement.consent.text}</AppText>
                </Card>
                {!!problem && <AppText variant="footnote" color="danger">{problem}</AppText>}
                <AppButton title="I agree" onPress={agree} loading={busy} fullWidth />
                <AppButton title="Not now" variant="ghost" onPress={onClose} disabled={busy} fullWidth />
              </>
            ) : (
              <>
                <TextField label="Your full name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
                <View style={{ gap: Space.xs }}>
                  <AppText variant="subhead">Your signature</AppText>
                  <SignaturePad onDrawing={setDrawing} onChange={(s, size) => { setStrokes(s); setPad(size); }} />
                </View>
                <View style={styles.confirm}>
                  <AppSwitch value={confirmRead} onValueChange={setConfirmRead} />
                  <AppText variant="callout" style={{ flex: 1 }}>
                    I have read {agreement.title} (version {agreement.version}) and agree to it.
                  </AppText>
                </View>
                {!!problem && <AppText variant="footnote" color="danger">{problem}</AppText>}
                <AppButton title="Sign" icon="checkmark-outline" onPress={sign} loading={busy} loadingTitle="Signing…" disabled={!canSign} fullWidth />
                <AppButton title="Cancel" variant="ghost" onPress={onClose} disabled={busy} fullWidth />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  meta: { flexDirection: "row", gap: Space.xs, paddingHorizontal: Space.gutter, flexWrap: "wrap" },
  description: { paddingHorizontal: Space.gutter, marginTop: Space.xs },
  viewer: { flex: 1, marginHorizontal: Space.gutter, marginTop: Space.sm, borderRadius: Radius.lg, borderWidth: 1, overflow: "hidden" },
  footer: { paddingHorizontal: Space.gutter, paddingTop: Space.sm, paddingBottom: Space.sm, gap: Space.xs, borderTopWidth: StyleSheet.hairlineWidth },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: "92%" },
  sheetContent: { padding: Space.gutter, gap: Space.md },
  confirm: { flexDirection: "row", alignItems: "center", gap: Space.sm },
});
