import { ConfigService } from '@nestjs/config';

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  temperature: number;
  messages: ChatCompletionMessage[];
  response_format?: { type: 'json_object' };
};

/**
 * 国内服务器无法直连 OpenAI 时：配置 MUPI_AI_LLM_URL 指向境外 mupi-ai 的 /api/llm，由该机转发。
 * 未配置 relay 且未配置 OPENAI_API_KEY 时抛错。
 */
export async function chatCompletionAssistantText(
  config: ConfigService,
  req: ChatCompletionRequest,
): Promise<string> {
  const relayUrl = config.get<string>('MUPI_AI_LLM_URL')?.trim();
  const relaySecret =
    config.get<string>('MUPI_AI_INGRESS_SECRET')?.trim() ||
    config.get<string>('INTERNAL_RPC_TOKEN')?.trim() ||
    '';
  const apiKey = config.get<string>('OPENAI_API_KEY')?.trim();

  if (relayUrl) {
    if (!relaySecret) {
      throw new Error(
        '已配置 MUPI_AI_LLM_URL 但缺少 MUPI_AI_INGRESS_SECRET 或与后端一致的 INTERNAL_RPC_TOKEN（用于 X-Internal-Secret）',
      );
    }
    const res = await fetch(relayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': relaySecret,
      },
      body: JSON.stringify({
        model: req.model,
        temperature: req.temperature,
        messages: req.messages,
        ...(req.response_format
          ? { response_format: req.response_format }
          : {}),
      }),
    });
    const raw = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err =
        typeof raw.error === 'string' ? raw.error : JSON.stringify(raw);
      throw new Error(`Mupi AI LLM relay failed (${res.status}): ${err}`);
    }
    const content = raw.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Mupi AI LLM relay returned empty content');
    }
    return content.trim();
  }

  if (!apiKey) {
    throw new Error(
      '未配置 MUPI_AI_LLM_URL（境外转发）且未配置 OPENAI_API_KEY（直连）',
    );
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: req.model,
      temperature: req.temperature,
      messages: req.messages,
      ...(req.response_format ? { response_format: req.response_format } : {}),
    }),
  });

  const raw = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof raw.error === 'object' &&
      raw.error &&
      typeof (raw.error as { message?: string }).message === 'string'
        ? (raw.error as { message: string }).message
        : JSON.stringify(raw);
    throw new Error(`OpenAI request failed: ${msg}`);
  }

  const choice = (raw.choices as unknown[])?.[0] as
    | { message?: { content?: string } }
    | undefined;
  const text = choice?.message?.content?.trim();
  if (!text) {
    throw new Error('OpenAI returned empty content');
  }
  return text;
}

export function hasOpenAiPath(config: ConfigService): boolean {
  const relay = config.get<string>('MUPI_AI_LLM_URL')?.trim();
  const key = config.get<string>('OPENAI_API_KEY')?.trim();
  return Boolean(relay || key);
}
