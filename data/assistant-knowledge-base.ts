import { AssistantKnowledgeEntry } from "@/data-types/assistant";

// Deterministic, in-app-navigation answers. Matched locally before ever
// calling the LLM — keeps "how do I get to X" instant and free.
export const ASSISTANT_KNOWLEDGE_BASE: AssistantKnowledgeEntry[] = [
  {
    id: "dark-mode",
    keywords: [
      "dark mode",
      "light mode",
      "dark theme",
      "light theme",
      "night mode",
      "change theme",
      "change the theme",
      "switch theme",
      "toggle theme",
      "app theme",
      "theme",
    ],
    answer:
      "You can switch between light and dark mode in Settings — tap the \"Light/Dark theme\" toggle.",
    action: { label: "Open Settings", route: "/(main)/settings" },
  },
  {
    id: "documents-list",
    keywords: [
      "my documents",
      "view documents",
      "uploaded documents",
      "compliance documents",
      "see my documents",
    ],
    answer:
      "Your uploaded documents are under the Documents tab, split into General, Professional, and Others.",
    action: { label: "Open Documents", route: "/(tabs)/documents" },
  },
  {
    id: "document-replace",
    keywords: [
      "replace document",
      "update document",
      "re-upload",
      "reupload",
      "expired document",
      "renew document",
      "upload a new file",
    ],
    answer:
      "Open the document from the Documents tab, then tap \"Replace document\" to upload a new file — it'll be sent for review automatically.",
    action: { label: "Open Documents", route: "/(tabs)/documents" },
  },
  {
    id: "document-preview",
    keywords: [
      "preview document",
      "view document",
      "see document",
      "open document",
    ],
    answer:
      "Tap a document in the Documents tab, then use the \"Preview\" button to view the file you uploaded.",
    action: { label: "Open Documents", route: "/(tabs)/documents" },
  },
  {
    id: "shifts",
    keywords: [
      "find shift",
      "available shifts",
      "book a shift",
      "apply for shift",
      "browse shifts",
    ],
    answer: "You can browse and apply for available shifts from the Shifts tab.",
    action: { label: "Open Shifts", route: "/(tabs)/shifts" },
  },
  {
    id: "schedule",
    keywords: [
      "my schedule",
      "upcoming shifts",
      "calendar",
      "my roster",
      "shift calendar",
    ],
    answer: "Your upcoming and past shifts are on the Schedule tab.",
    action: { label: "Open Schedule", route: "/(tabs)/schedules" },
  },
  {
    id: "profile",
    keywords: [
      "update profile",
      "edit profile",
      "personal details",
      "change my details",
      "update my info",
    ],
    answer: "You can update your personal details from the Profile screen.",
    action: { label: "Open Profile", route: "/(main)/profile" },
  },
  {
    id: "account",
    keywords: ["account details", "account settings", "my account"],
    answer: "Your account details are managed from the Account screen.",
    action: { label: "Open Account", route: "/(main)/account" },
  },
  {
    id: "password",
    keywords: [
      "change password",
      "reset password",
      "forgot password",
      "update password",
    ],
    answer:
      "You can change your password from the Change Password screen, accessible via Settings.",
    action: { label: "Change Password", route: "/(main)/change-password" },
  },
  {
    id: "notification-settings",
    keywords: [
      "notification settings",
      "turn off notifications",
      "push notifications",
      "enable notifications",
      "disable notifications",
    ],
    answer: "Notification preferences can be turned on or off in Settings.",
    action: { label: "Open Settings", route: "/(main)/settings" },
  },
  {
    id: "notifications-inbox",
    keywords: [
      "notifications",
      "view notifications",
      "see my notifications",
      "notification feed",
      "unread notifications",
      "new notifications",
    ],
    answer: "You can see all your notifications from the Notifications screen.",
    action: { label: "Open Notifications", route: "/(main)/notifications" },
  },
  {
    id: "facilities",
    keywords: ["facilities", "facility list", "which facilities"],
    answer: "You can see facility information from the Facilities screen.",
    action: { label: "Open Facilities", route: "/(main)/facilities" },
  },
  {
    id: "interviews",
    keywords: ["interview", "interviews", "upcoming interview"],
    answer: "Your interview requests and schedule are on the Interviews screen.",
    action: { label: "Open Interviews", route: "/(main)/interviews" },
  },
  {
    id: "dashboard",
    keywords: [
      "dashboard",
      "home screen",
      "overview",
      "payrun",
      "current payrun",
    ],
    answer:
      "The Home tab is your dashboard — it shows available, upcoming, and scheduled shift counts plus your current payrun.",
    action: { label: "Open Home", route: "/(tabs)" },
  },
  {
    id: "availability-toggle",
    keywords: [
      "available for jobs",
      "set my availability",
      "turn off availability",
      "mark myself unavailable",
      "toggle availability",
    ],
    answer:
      "The \"Available for jobs\" toggle is at the top of the More tab — switch it off if you don't want to be offered shifts.",
    action: { label: "Open More", route: "/(tabs)/more" },
  },
  {
    id: "shift-lifecycle-actions",
    keywords: [
      "accept a shift",
      "accept shift",
      "start shift",
      "end shift",
      "clock in",
      "clock out",
      "begin shift",
      "finish shift",
    ],
    answer:
      "Open the shift from the Shifts or Schedule tab — its detail screen has buttons to accept, start, and end the shift as you go.",
    action: { label: "Open Shifts", route: "/(tabs)/shifts" },
  },
  {
    id: "transfer-shift",
    keywords: [
      "transfer shift",
      "hand off shift",
      "give away shift",
      "reassign shift",
      "swap my shift",
    ],
    answer:
      "Open the shift you want to hand off from the Schedule tab, then tap \"Transfer\" on its detail screen.",
    action: { label: "Open Schedule", route: "/(tabs)/schedules" },
  },
  {
    id: "shift-rating",
    keywords: [
      "rate a shift",
      "rate my shift",
      "review a shift",
      "leave feedback",
      "shift rating",
    ],
    answer:
      "You'll be prompted to rate a shift once it ends — you can also open a completed shift from the Schedule tab to leave a review.",
    action: { label: "Open Schedule", route: "/(tabs)/schedules" },
  },
  {
    id: "self-onboarding",
    keywords: [
      "complete registration",
      "finish onboarding",
      "registration steps",
      "complete my profile setup",
      "finish signing up",
    ],
    answer:
      "If your registration isn't complete yet, the app will guide you through the remaining onboarding steps automatically when you open it.",
  },
  {
    id: "sign-out",
    keywords: ["sign out", "log out", "logout", "signout"],
    answer: "You can sign out from the More tab.",
    action: { label: "Open More", route: "/(tabs)/more" },
  },
];
