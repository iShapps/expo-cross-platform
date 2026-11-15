import { postResource } from "@/api-actions/mutations";

// Agreements (HR module): policies to read and sign, contracts and forms to fill in and sign, in the app.
// Backend: routes/tenant/mobile.php → Mobile\AgreementController. Business
// failures come back as HTTP 200 {status:false, message}.

export type AgreementStatus = "pending" | "viewed" | "signed";

export type AgreementSummary = {
  id: number;
  /** A contract is the worker's own filled-in copy, signed by both sides; a form is one they fill in and sign. */
  kind: "policy" | "contract" | "form";
  title: string;
  version: number;
  status: AgreementStatus;
  sent_at: string | null;
  signed_at: string | null;
};

/**
 * A question on a contract or form, answered before signing; printed on it with their signature.
 * Answers are strings: a date as YYYY-MM-DD, a tick as "yes", a choice as one of `options`.
 */
export type AgreementInput = {
  key: string;
  label: string;
  type: "text" | "multiline" | "date" | "checkbox" | "choice";
  /** Required when asked (see show_if). */
  required: boolean;
  /** How a text answer is checked: email, phone, postcode, state, tfn, abn, bsb, account, usi, digits. */
  format?: string | null;
  /** A choice's answers. */
  options: string[];
  help?: string | null;
  /** Ask only when the answer to `key` is one of `values` ("" = left empty). */
  show_if?: { key: string; values: string[] } | null;
  /** Most characters the printed boxes hold (text). */
  max?: number | null;
  /** Their answer once signed; before that, what their profile says (they can change it). */
  value: string | null;
};

export type AgreementDetail = AgreementSummary & {
  description: string | null;
  /** A short-lived signed link to the PDF. */
  document_url: string;
  /** Once signed: the signed contract (both signatures + certificate), the signed form, or a policy's certificate. */
  certificate_url: string | null;
  consent: { version: string; text: string; given: boolean };
  /** Contracts and forms; empty for policies. */
  inputs?: AgreementInput[];
};

type Envelope<T> = { status: boolean; message: string; data: T };

export type SignPayload = {
  signer_name: string;
  /** Points per stroke, in the pad's own coordinates. */
  strokes: [number, number][][];
  pad: { width: number; height: number };
  confirm_read: true;
  device?: { platform?: string; model?: string; os_version?: string; app_version?: string };
  /** The answers (AgreementDetail.inputs), as a list: keys contain dots. */
  inputs?: { key: string; value: string }[];
};

/** Throws the server's message when it answers {status:false}. */
function unwrap<T>(res: Envelope<T>): T {
  if (!res.status) throw new Error(res.message || "Something went wrong.");
  return res.data;
}

export const AGREEMENTS_QUERY_KEY = ["agreements"] as const;

export async function getAgreements() {
  return unwrap(
    await postResource<Record<string, never>, Envelope<{ to_sign: AgreementSummary[]; signed: AgreementSummary[]; consented: boolean }>>(
      "/hcp/agreements",
      {},
    ),
  );
}

export async function getAgreement(id: number) {
  return unwrap(await postResource<Record<string, never>, Envelope<AgreementDetail>>(`/hcp/agreements/${id}`, {}));
}

export async function markAgreementViewed(id: number) {
  return postResource<Record<string, never>, Envelope<unknown>>(`/hcp/agreements/${id}/viewed`, {});
}

export async function giveSigningConsent() {
  return unwrap(await postResource<Record<string, never>, Envelope<unknown>>("/hcp/agreements/consent", {}));
}

export async function signAgreement(id: number, payload: SignPayload) {
  return unwrap(await postResource<SignPayload, Envelope<AgreementDetail>>(`/hcp/agreements/${id}/sign`, payload));
}
