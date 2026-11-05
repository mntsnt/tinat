export type AIModelId = "gemini";

export interface AIModelInfo {
  id: AIModelId;
  name: string;
  provider: string;
  badge: string;
  description: string;
  modelCode: string;
}

export const AVAILABLE_MODELS: AIModelInfo[] = [
  {
    id: "gemini",
    name: "Google Gemini Flash",
    provider: "Google Cloud",
    badge: "Clinical Intelligence",
    description: "Fast, highly grounded clinical research synthesis and biostatistical analysis",
    modelCode: "gemini-3.6-flash",
  },
];

export interface UnifiedAnalysisParams {
  modelId?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface UnifiedChatParams {
  modelId?: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "model" | "assistant"; content: string }>;
  temperature?: number;
}
