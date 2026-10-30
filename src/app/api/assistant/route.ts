import Anthropic from '@anthropic-ai/sdk';

/*
 * Emergency guidance assistant. Streams plain text back to the browser.
 * When the AI service can't be reached (no API key, network down), it returns
 * 503 and the client falls back to built-in offline safety guides.
 */

const MODEL = 'claude-opus-5-5';
const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;

const SYSTEM_PROMPT = `You are Sahayak, the emergency guidance assistant on NepalDRR, Nepal's disaster information portal. People reach you on their phones during or just after floods, landslides, earthquakes, fires, storms and accidents, often frightened, sometimes injured, sometimes on a weak connection.

Your job is to tell them what to do right now to stay safe, in short plain steps they can follow while stressed.

How to answer:
- If anyone's life may be in danger, start by telling them which number to call: 102 ambulance, 100 police, 101 fire brigade, 1155 national disaster helpline, 1149 flood early warning. Then give the steps.
- Lead with the most urgent action. Use short numbered steps, one action per step. Keep the whole answer brief enough to read on a phone screen; offer more detail only if they ask.
- Ask one short question when you need to know something important (for example whether water is rising, or whether someone is breathing), but give the safest immediate step first.
- Reply in the language the person writes in. If they write Nepali (Devanagari or romanised), reply in simple Nepali.
- Use the local context provided below (their district, active alerts, nearby shelters). Do not invent shelters, phone numbers, road conditions or official instructions that are not given to you; if you do not know, say so and point them to 1155 or their ward office.
- Follow official alert instructions when they apply to the person's area.
- For medical situations give standard first-aid steps only and always tell them to get professional help.
- You are not a replacement for emergency services. Never tell someone not to call for help.
- Be calm and kind. No lectures, no long disclaimers.`;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

interface AssistantContext {
  district?: string;
  alerts?: string[];
  shelters?: string[];
}

function clip(s: unknown, n: number): string {
  return typeof s === 'string' ? s.slice(0, n) : '';
}

function parseBody(body: unknown): { messages: ChatTurn[]; context: AssistantContext } | null {
  if (!body || typeof body !== 'object') return null;
  const { messages, context } = body as { messages?: unknown; context?: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;

  const turns: ChatTurn[] = [];
  for (const [i, m] of messages.entries()) {
    const role = (m as ChatTurn)?.role;
    const content = (m as ChatTurn)?.content;
    const expected = i % 2 === 0 ? 'user' : 'assistant';
    if (role !== expected || typeof content !== 'string' || !content.trim()) return null;
    turns.push({ role, content: content.slice(0, MAX_CHARS) });
  }
  if (turns[turns.length - 1].role !== 'user') return null;

  const ctx = (context ?? {}) as AssistantContext;
  return {
    messages: turns,
    context: {
      district: clip(ctx.district, 100),
      alerts: Array.isArray(ctx.alerts) ? ctx.alerts.slice(0, 5).map((a) => clip(a, 600)) : [],
      shelters: Array.isArray(ctx.shelters) ? ctx.shelters.slice(0, 5).map((s) => clip(s, 200)) : []
    }
  };
}

function contextBlock(ctx: AssistantContext): string {
  const lines = ['Local context for this person:'];
  lines.push(ctx.district ? `- Location: ${ctx.district} district, Nepal` : '- Location: not shared');
  lines.push(ctx.alerts?.length ? `- Active alerts for their area:\n${ctx.alerts.map((a) => `  * ${a}`).join('\n')}` : '- No active alerts for their area');
  if (ctx.shelters?.length) lines.push(`- Nearest shelters and services:\n${ctx.shelters.map((s) => `  * ${s}`).join('\n')}`);
  return lines.join('\n');
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(request: Request) {
  let parsed: ReturnType<typeof parseBody>;
  try {
    parsed = parseBody(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return json(400, 'invalid_request');

  let client: Anthropic;
  try {
    client = new Anthropic();
  } catch {
    return json(503, 'assistant_unavailable');
  }

  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    // Low effort keeps first words fast; this is short practical guidance, not deep analysis.
    output_config: { effort: 'low' },
    // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: `${SYSTEM_PROMPT}\n\n${contextBlock(parsed.context)}`,
    messages: parsed.messages
  });
  // Errors are handled through the iterator below; this listener stops the SDK
  // from also reporting them as an unhandled promise rejection.
  stream.on('error', () => {});

  // Wait for the first event so connection and auth failures become a proper status code
  // the client can act on, instead of a broken stream.
  const events = stream[Symbol.asyncIterator]();
  let first: IteratorResult<Anthropic.Beta.Messages.BetaRawMessageStreamEvent>;
  try {
    first = await events.next();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      return json(503, 'assistant_unavailable');
    }
    if (err instanceof Anthropic.RateLimitError) return json(429, 'rate_limited');
    if (err instanceof Anthropic.APIConnectionError) return json(503, 'assistant_unavailable');
    if (err instanceof Anthropic.APIError) return json(502, 'upstream_error');
    // Missing credentials surface here as a plain AnthropicError.
    return json(503, 'assistant_unavailable');
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: Anthropic.Beta.Messages.BetaRawMessageStreamEvent) => {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      };
      try {
        if (!first.done) emit(first.value);
        for (let next = await events.next(); !next.done; next = await events.next()) emit(next.value);

        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          controller.enqueue(
            encoder.encode(
              '\n\nI can’t help with that here. If you or someone else is in danger, call 102, 100, 101 or 1155 now.'
            )
          );
        }
      } catch {
        controller.enqueue(
          encoder.encode('\n\nThe connection to the assistant was lost. If you are in danger, call 1155 or 102 now.')
        );
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    }
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
