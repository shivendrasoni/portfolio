import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";

export const DEFAULT_WEBLLM_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

export type WebLLMStatus = {
  state: "idle" | "loading" | "ready" | "error";
  progress?: number;
  detail?: string;
  error?: string;
};

let engineInstance: MLCEngine | null = null;
let enginePromise: Promise<MLCEngine> | null = null;
let status: WebLLMStatus = { state: "idle" };
const listeners = new Set<(next: WebLLMStatus) => void>();

const setStatus = (next: WebLLMStatus) => {
  status = next;
  listeners.forEach((listener) => listener(status));
};

export const getWebLLMStatus = () => status;

export const onWebLLMStatusChange = (listener: (next: WebLLMStatus) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

export const initWebLLM = async (model = DEFAULT_WEBLLM_MODEL) => {
  if (engineInstance) return engineInstance;
  if (enginePromise) return enginePromise;

  if (!("gpu" in navigator)) {
    const message = "WebGPU is not available in this browser.";
    setStatus({ state: "error", error: message });
    throw new Error(message);
  }

  setStatus({ state: "loading", progress: 0 });

  enginePromise = CreateMLCEngine(model, {
    initProgressCallback: (progress: { progress?: number; text?: string }) => {
      const nextProgress = typeof progress?.progress === "number" ? progress.progress : undefined;
      const nextDetail = typeof progress?.text === "string" ? progress.text : undefined;
      setStatus({ state: "loading", progress: nextProgress, detail: nextDetail });
    },
  });

  try {
    engineInstance = await enginePromise;
    setStatus({ state: "ready" });
    return engineInstance;
  } catch (error) {
    setStatus({ state: "error", error: getErrorMessage(error) });
    enginePromise = null;
    throw error;
  }
};

export const generateChat = async (params: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}) => {
  const engine = await initWebLLM();
  return engine.chat.completions.create({
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
    response_format: params.response_format,
  });
};

export const generateChatStream = async (params: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}) => {
  const engine = await initWebLLM();
  return engine.chat.completions.create({
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
    response_format: params.response_format,
    stream: true,
    stream_options: { include_usage: true },
  });
};
