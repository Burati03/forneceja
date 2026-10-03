import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const RUN_ID = "X-Lovable-AIG-Run-ID";
const MODEL = "openai/gpt-6-astra";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
}

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Streams a Responses call and returns the final text. */
export async function askModel(instructions: string, messages: ModelMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new GatewayError(401, "Busca inteligente não configurada.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages,
    maxRetries: 0,
    onError: ({ error }) => { failure = error; console.error("AI gateway error", error); },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  let text = "";
  try { text = await result.text; } catch (e) { failure ??= e; }
  if (failure) {
    const status = (failure as any)?.statusCode ?? 500;
    const msg =
      status === 402 ? "Os créditos de IA acabaram. Peça ao responsável pelo app para recarregar." :
      status === 429 ? "Muitas buscas agora. Tente de novo em alguns segundos." :
      status === 403 ? "A busca inteligente está bloqueada para este app no momento." :
      "Não foi possível fazer a busca inteligente agora.";
    throw new GatewayError(status, msg);
  }
  return text;
}
