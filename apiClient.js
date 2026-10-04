import { API_CONFIG, SYSTEM_PROMPT } from './agentConfig.js'

/**
 * Converts our internal message history to Gemini's `contents` format.
 * Gemini uses { role: 'user'|'model', parts: [{ text }] }
 * Note: Gemini does NOT allow the conversation to start with role 'model'.
 */
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

/**
 * Sends conversation history to Gemini and returns the assistant reply.
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {Promise<string>} assistant text
 */
export async function sendToAI(messages) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Missing VITE_GEMINI_API_KEY in .env — add your Gemini API key to continue.')
  }

  const url = `${API_CONFIG.endpoint(API_CONFIG.model)}?key=${apiKey}`

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: toGeminiContents(messages),
    generationConfig: {
      maxOutputTokens: API_CONFIG.max_tokens,
      temperature: 1.0,
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err}`)
  }

  const data = await response.json()

  // Extract text from the first candidate's parts
  const text = data.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    ?.map((p) => p.text)
    ?.join(' ')
    ?.trim()

  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}
