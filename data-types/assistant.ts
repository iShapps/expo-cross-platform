export type AssistantAction = {
  label: string;
  route: string;
};

export type AssistantKnowledgeEntry = {
  id: string;
  keywords: string[];
  answer: string;
  action?: AssistantAction;
};

export type AssistantRole = "user" | "assistant";

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  text: string;
  action?: AssistantAction;
  isEscalationOffer?: boolean;
};
