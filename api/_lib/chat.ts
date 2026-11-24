import {GoogleGenAI, ThinkingLevel} from '@google/genai';
import type {SupabaseClient} from '@supabase/supabase-js';
import {
  buildChatSystemInstruction,
  CHAT_CONFIG,
  stripHtmlTags,
  type KnowledgeProject,
} from './knowledge.js';
import {siteData} from './site-data.js';
import {
  getClientIp,
  hashIp,
  parseJsonBody,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './vercel.js';

interface ChatHistoryInput {
  role?: unknown;
  content?: unknown;
  text?: unknown;
}

interface ChatRequestBody {
  message?: unknown;
  history?: unknown;
}

export interface ChatLogRecord {
  id: string;
  question: string;
  answer: string;
  ip_hash: string;
  created_at: string;
}

let cachedKnowledgeProjects: {
  items: KnowledgeProject[];
  expiresAt: number;
} | null = null;

const memoryRateLimits = new Map<string, number[]>();

export async function getCachedKnowledgeProjects(
  supabase: SupabaseClient | null,
): Promise<KnowledgeProject[]> {
  const now = Date.now();
  if (cachedKnowledgeProjects && now < cachedKnowledgeProjects.expiresAt) {
    return cachedKnowledgeProjects.items;
  }

  let items: KnowledgeProject[] = siteData.fallbackProjects
    .filter((p) => p.published)
    .map((p) => ({
      title: p.title,
      description: p.description,
      live_url: p.live_url,
    }));

  if (supabase) {
    try {
      const {data, error} = await supabase
        .from('projects')
        .select('title, description, live_url')
        .eq('published', true)
        .order('sort_order', {ascending: true})
        .order('created_at', {ascending: false});

      if (!error && Array.isArray(data) && data.length > 0) {
        items = data.map((row) => ({
          title: String(row.title || ''),
          description: String(row.description || ''),
          live_url: row.live_url ? String(row.live_url) : null,
        }));
      } else if (error) {
        console.error('[api/chat] Failed loading projects from Supabase:', error);
      }
    } catch (err) {
      console.error('[api/chat] Exception loading projects from Supabase:', err);
    }
  }

  cachedKnowledgeProjects = {
    items,
    expiresAt: now + CHAT_CONFIG.PROJECT_CACHE_TTL_MS,
  };
  return items;
}

async function checkAndRecordRateLimit(
  supabase: SupabaseClient | null,
  ipHash: string,
): Promise<boolean> {
  const now = Date.now();
  const windowStartMs = now - CHAT_CONFIG.RATE_LIMIT_WINDOW_MS;
  const windowStartIso = new Date(windowStartMs).toISOString();

  if (supabase) {
    try {
      const {count, error} = await supabase
        .from('chat_rate_limits')
        .select('*', {count: 'exact', head: true})
        .eq('ip_hash', ipHash)
        .gte('created_at', windowStartIso);

      if (!error) {
        if ((count || 0) >= CHAT_CONFIG.RATE_LIMIT_MAX) {
          return false;
        }
        const {error: insertError} = await supabase
          .from('chat_rate_limits')
          .insert({ip_hash: ipHash});
        if (insertError) {
          console.error('[api/chat] Rate limit insert error:', insertError);
        }
        return true;
      }

      console.error('[api/chat] Rate limit table query error (using memory fallback):', error);
    } catch (err) {
      console.error('[api/chat] Rate limit exception (using memory fallback):', err);
    }
  }

  const timestamps = (memoryRateLimits.get(ipHash) || []).filter(
    (ts) => ts >= windowStartMs,
  );
  if (timestamps.length >= CHAT_CONFIG.RATE_LIMIT_MAX) {
    memoryRateLimits.set(ipHash, timestamps);
    return false;
  }
  timestamps.push(now);
  memoryRateLimits.set(ipHash, timestamps);
  return true;
}

function normalizeHistory(
  rawHistory: unknown,
): {valid: true; turns: Array<{role: 'user' | 'model'; text: string}>} | {valid: false; error: string} {
  if (rawHistory === undefined || rawHistory === null) {
    return {valid: true, turns: []};
  }
  if (!Array.isArray(rawHistory)) {
    return {valid: false, error: 'History must be an array.'};
  }
  if (rawHistory.length > CHAT_CONFIG.MAX_HISTORY_ITEMS) {
    return {
      valid: false,
      error: `At most ${CHAT_CONFIG.MAX_HISTORY_ITEMS} history messages are allowed.`,
    };
  }

  const turns: Array<{role: 'user' | 'model'; text: string}> = [];
  for (const item of rawHistory as ChatHistoryInput[]) {
    if (!item || typeof item !== 'object') {
      return {valid: false, error: 'Invalid history item.'};
    }
    const rawRole = String(item.role || '').trim().toLowerCase();
    const role: 'user' | 'model' | null =
      rawRole === 'user'
        ? 'user'
        : rawRole === 'assistant' || rawRole === 'model'
          ? 'model'
          : null;
    if (!role) {
      return {valid: false, error: 'Invalid history role.'};
    }

    const rawText =
      typeof item.content === 'string'
        ? item.content
        : typeof item.text === 'string'
          ? item.text
          : '';
    const cleaned = stripHtmlTags(rawText).slice(0, 1200);
    if (!cleaned) continue;

    // Skip leading model greeting before first user message for clean turn alternation
    if (turns.length === 0 && role === 'model') continue;

    const prev = turns[turns.length - 1];
    if (prev && prev.role === role) {
      prev.text = `${prev.text}\n${cleaned}`;
    } else {
      turns.push({role, text: cleaned});
    }
  }

  return {valid: true, turns};
}

function sanitizeText(raw: string): string {
  const secretValues = [
    process.env.GEMINI_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.RESEND_API_KEY,
  ]
    .map((v) => (v || '').trim())
    .filter((v) => v.length >= 6);

  let cleaned = raw;
  for (const secret of secretValues) {
    cleaned = cleaned.split(secret).join('[REDACTED]');
  }

  return cleaned
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, '$1[REDACTED]')
    .replace(/AIza[0-9A-Za-z\-_]{16,}/g, '[REDACTED]')
    .replace(/sb_secret_[0-9A-Za-z\-_]+/g, '[REDACTED]')
    .slice(0, 600);
}

function extractGeminiError(err: unknown): {
  status: number | string;
  message: string;
} {
  let status: number | string = 'unknown';
  let rawMessage = 'Unknown error';

  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    if (typeof record.status === 'number' || typeof record.status === 'string') {
      status = record.status;
    } else if (
      typeof record.code === 'number' ||
      typeof record.code === 'string'
    ) {
      status = record.code;
    }
    if (typeof record.message === 'string' && record.message.trim()) {
      rawMessage = record.message.trim();
    }
  } else if (typeof err === 'string' && err.trim()) {
    rawMessage = err.trim();
  }

  return {
    status,
    message: sanitizeText(rawMessage),
  };
}

function resolveGeminiModel(rawModel: string | undefined): string {
  const trimmed = (rawModel || '').trim();
  if (
    !trimmed ||
    !trimmed.toLowerCase().startsWith('gemini') ||
    !/^[a-z0-9._-]+$/i.test(trimmed)
  ) {
    return CHAT_CONFIG.DEFAULT_GEMINI_MODEL;
  }
  return trimmed;
}

const VISITOR_UNAVAILABLE_MESSAGE =
  'Chat is temporarily unavailable, email ojassawasthi@gmail.com';

export async function handleChatRequest(
  req: ApiRequest,
  res: ApiResponse,
  supabase: SupabaseClient | null,
  onFallbackLog?: (entry: ChatLogRecord) => void,
): Promise<void> {
  let geminiModel: string = CHAT_CONFIG.DEFAULT_GEMINI_MODEL;

  try {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');

    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!geminiApiKey) {
      sendJson(res, 503, {error: 'Chat is not configured'});
      return;
    }

    geminiModel = resolveGeminiModel(process.env.GEMINI_MODEL);

    const body = await parseJsonBody<ChatRequestBody>(req);
    if (typeof body.message !== 'string') {
      sendJson(res, 400, {
        error: 'Message must be a text string between 1 and 500 characters.',
      });
      return;
    }

    const cleanMessage = stripHtmlTags(body.message);
    if (
      cleanMessage.length < 1 ||
      cleanMessage.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH
    ) {
      sendJson(res, 400, {
        error: 'Message must be between 1 and 500 characters.',
      });
      return;
    }

    const historyCheck = normalizeHistory(body.history);
    if (!historyCheck.valid) {
      sendJson(res, 400, {error: historyCheck.error});
      return;
    }

    const ipHash = hashIp(getClientIp(req));
    const allowed = await checkAndRecordRateLimit(supabase, ipHash);
    if (!allowed) {
      sendJson(res, 429, {
        error:
          'You have sent quite a few messages in the last few minutes. Please pause briefly or email ojassawasthi@gmail.com.',
      });
      return;
    }

    const projects = await getCachedKnowledgeProjects(supabase);
    const systemInstruction = buildChatSystemInstruction(projects);

    const contents = [
      ...historyCheck.turns.map((turn) => ({
        role: turn.role,
        parts: [{text: turn.text}],
      })),
      {
        role: 'user' as const,
        parts: [{text: cleanMessage}],
      },
    ];

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const isGemini4 = geminiModel.toLowerCase().startsWith('gemini-4-');
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents,
      config: isGemini4
        ? {
            systemInstruction,
            thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          }
        : {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 400,
          },
    });

    const reply = (response.text || '').trim();
    if (!reply) {
      const finishReason = response.candidates?.[0]?.finishReason || 'unknown';
      console.error(
        `[api/chat] Empty response from Gemini (status=200, model=${geminiModel}, finishReason=${String(finishReason)})`,
      );
      sendJson(res, 502, {error: VISITOR_UNAVAILABLE_MESSAGE});
      return;
    }

    // Optional non-fatal chat log persistence
    if (supabase) {
      try {
        const {error: logError} = await supabase.from('chat_logs').insert({
          question: cleanMessage,
          answer: reply,
          ip_hash: ipHash,
        });
        if (logError) {
          console.error(
            '[api/chat] Non-fatal chat_logs insert error:',
            sanitizeText(logError.message || 'Unknown Supabase error'),
          );
        }
      } catch (logErr) {
        const logDetail = extractGeminiError(logErr);
        console.error(
          '[api/chat] Non-fatal chat_logs exception:',
          logDetail.message,
        );
      }
    } else if (onFallbackLog) {
      onFallbackLog({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        question: cleanMessage,
        answer: reply,
        ip_hash: ipHash,
        created_at: new Date().toISOString(),
      });
    }

    sendJson(res, 200, {reply});
  } catch (err) {
    const detail = extractGeminiError(err);
    console.error(
      `[api/chat] Gemini error (status=${detail.status}, model=${geminiModel}): ${detail.message}`,
    );
    sendJson(res, 500, {error: VISITOR_UNAVAILABLE_MESSAGE});
  }
}
