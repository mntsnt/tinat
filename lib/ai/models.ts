export type AIModelId =
  | "gemini"
  | "nvidia-nemotron-lightning"
  | "nvidia-nemotron-nano"
  | "nvidia-nemotron-super";

export type AIProviderId = "GEMINI" | "NVIDIA";

export interface AIModelInfo {
  id: AIModelId;
  name: string;
  provider: string;
  providerId: AIProviderId;
  badge: string;
  description: string;
  modelCode: string;
}

export const AVAILABLE_MODELS: AIModelInfo[] = [
  {
    id: "gemini",
    name: "Google Gemini Flash",
    provider: "Google Cloud",
    providerId: "GEMINI",
    badge: "Clinical Intelligence",
    description: "Fast, highly grounded clinical research synthesis and biostatistical analysis",
    modelCode: "gemini-3.6-flash",
  },
  {
    id: "nvidia-nemotron-lightning",
    name: "Nemotron 3.5 Lightning",
    provider: "NVIDIA NIM",
    providerId: "NVIDIA",
    badge: "Fast",
    description: "A fast general-purpose model for research chat and drafting",
    modelCode: "nvidia/nemotron-3.5-lightning-30b-a3b",
  },
  {
    id: "nvidia-nemotron-nano",
    name: "Nemotron 3 Nano",
    provider: "NVIDIA NIM",
    providerId: "NVIDIA",
    badge: "Reasoning",
    description: "A compact model for research questions and structured reasoning",
    modelCode: "nvidia/nemotron-3-nano-30b-a3b",
  },
  {
    id: "nvidia-nemotron-super",
    name: "Nemotron 3 Super",
    provider: "NVIDIA NIM",
    providerId: "NVIDIA",
    badge: "Advanced",
    description: "A larger model for more involved research synthesis and analysis",
    modelCode: "nvidia/nemotron-3-super-120b-a12b",
  },
];

export function getAIModel(modelId?: string | null): AIModelInfo | null {
  if (!modelId) return AVAILABLE_MODELS[0];
  return AVAILABLE_MODELS.find(
    (model) => model.id === modelId || model.modelCode === modelId
  ) ?? null;
}

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
