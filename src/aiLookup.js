const OPENROUTER_FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-12b-it:free',
  'qwen/qwen3-8b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

const LOOKUP_SYSTEM = `You are a concise English-Spanish dictionary specializing in American slang, idioms, and phrasal verbs. When given a word in sentence context, if that word is part of a common American English expression or phrasal verb (e.g. "link up", "no cap", "hit me up", "hang in there", "for sure", "what's good", "bet", "say less"), explain the FULL EXPRESSION — not just the single word. Reply with ONLY valid JSON, no extra text:
{"phrase":"the full expression or word you are explaining","es":"Spanish translation","def":"Brief English definition (max 10 words)","ex":"One short natural example sentence using the expression"}`;

const TRANSLATE_SYSTEM = `Translate the following English text to natural conversational Spanish. Reply with ONLY the Spanish translation, no labels or extra text.`;

async function callClaudeAI(key, systemPrompt, userMsg, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d?.content?.[0]?.text;
}

async function callOpenAICompatAI(endpoint, key, model, systemPrompt, userMsg, maxTokens) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d?.choices?.[0]?.message?.content;
}

async function callOpenRouterAI(key, systemPrompt, userMsg, maxTokens) {
  let lastErr;
  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      return await callOpenAICompatAI('https://openrouter.ai/api/v1/chat/completions', key, model, systemPrompt, userMsg, maxTokens);
    } catch (e) {
      if (e.message?.includes('No endpoints found') || e.message?.includes('Provider returned error')) { lastErr = e; continue; }
      throw e;
    }
  }
  throw lastErr;
}

function callAI(systemPrompt, userMsg, cfg, maxTokens) {
  const { provider, claudeKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel } = cfg;
  if (provider === 'claude' && claudeKey)
    return callClaudeAI(claudeKey, systemPrompt, userMsg, maxTokens);
  if (provider === 'openai' && openaiKey)
    return callOpenAICompatAI('https://api.openai.com/v1/chat/completions', openaiKey, 'gpt-4o-mini', systemPrompt, userMsg, maxTokens);
  if (provider === 'openrouter' && openrouterKey)
    return callOpenRouterAI(openrouterKey, systemPrompt, userMsg, maxTokens);
  if (provider === 'deepseek' && deepseekKey)
    return callOpenAICompatAI('https://api.deepseek.com/chat/completions', deepseekKey, 'deepseek-chat', systemPrompt, userMsg, maxTokens);
  if (provider === 'custom' && customKey && customEndpoint && customModel)
    return callOpenAICompatAI(customEndpoint, customKey, customModel, systemPrompt, userMsg, maxTokens);
  throw new Error('no_key');
}

export async function lookupWordAI(word, cfg, sentence = '') {
  const userMsg = sentence
    ? `Word: "${word}" — in context: "${sentence}"`
    : `Word or phrase: "${word}"`;
  const raw = await callAI(LOOKUP_SYSTEM, userMsg, cfg, 130);
  const match = raw?.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error('Could not parse response');
  return JSON.parse(match[0]);
}

export async function translateTextAI(text, cfg) {
  return callAI(TRANSLATE_SYSTEM, text, cfg, 220);
}
