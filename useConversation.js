import { useCallback, useReducer, useRef } from 'react'
import { sendToAI } from './apiClient.js'
import { AGENT_CONFIG } from './agentConfig.js'

// ─── State ────────────────────────────────────────────────────────────────────
const initialState = {
  messages: [],           // { id, role, content, timestamp }
  agentStatus: 'idle',    // idle | listening | thinking | speaking | error
  error: null,
  sessionStarted: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        sessionStarted: true,
        messages: [{
          id: Date.now(),
          role: 'assistant',
          content: `Hey! I'm ${AGENT_CONFIG.name}, your voice assistant. How can I help you today?`,
          timestamp: new Date(),
        }],
        agentStatus: 'idle',
      }
    case 'SET_STATUS':
      return { ...state, agentStatus: action.status, error: null }
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          id: Date.now(),
          role: 'user',
          content: action.content,
          timestamp: new Date(),
        }],
      }
    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, {
          id: Date.now(),
          role: 'assistant',
          content: action.content,
          timestamp: new Date(),
        }],
      }
    case 'SET_ERROR':
      return { ...state, agentStatus: 'error', error: action.error }
    case 'CLEAR_SESSION':
      return { ...initialState }
    default:
      return state
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useConversation({ speak, stopSpeaking, startListening, stopListening }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const processingRef = useRef(false)

  // ── Build API message array from history ───────────────────────────────────
  const buildApiMessages = useCallback((messages) => {
    return messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))
  }, [])

  // ── Start Session ──────────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    dispatch({ type: 'START_SESSION' })
    setTimeout(() => {
      const greeting = `Hey! I'm ${AGENT_CONFIG.name}, your voice assistant. How can I help you today?`
      speak(greeting, {
        onEnd: () => dispatch({ type: 'SET_STATUS', status: 'idle' }),
      })
      dispatch({ type: 'SET_STATUS', status: 'speaking' })
    }, 300)
  }, [speak])

  // ── Handle final transcribed user speech ───────────────────────────────────
  const handleUserSpeech = useCallback(async (transcript) => {
    if (!transcript.trim() || processingRef.current) return
    processingRef.current = true

    stopListening()
    stopSpeaking()

    // Add user message to UI
    dispatch({ type: 'ADD_USER_MESSAGE', content: transcript })
    dispatch({ type: 'SET_STATUS', status: 'thinking' })

    try {
      // Build history including the new user message
      const historyMessages = [
        ...buildApiMessages(state.messages),
        { role: 'user', content: transcript },
      ]

      const reply = await sendToAI(historyMessages)

      dispatch({ type: 'ADD_ASSISTANT_MESSAGE', content: reply })
      dispatch({ type: 'SET_STATUS', status: 'speaking' })

      speak(reply, {
        onEnd: () => {
          dispatch({ type: 'SET_STATUS', status: 'idle' })
          processingRef.current = false
        },
      })
    } catch (err) {
      const fallback = "I ran into a little hiccup there — could you try again?"
      dispatch({ type: 'ADD_ASSISTANT_MESSAGE', content: fallback })
      dispatch({ type: 'SET_STATUS', status: 'error', error: err.message })
      speak(fallback, {
        onEnd: () => {
          dispatch({ type: 'SET_STATUS', status: 'idle' })
          processingRef.current = false
        },
      })
    }
  }, [state.messages, buildApiMessages, speak, stopListening, stopSpeaking])

  // ── Handle text input (typed fallback) ────────────────────────────────────
  const handleTextInput = useCallback(async (text) => {
    if (!text.trim() || processingRef.current) return
    await handleUserSpeech(text)
  }, [handleUserSpeech])

  // ── Toggle mic ────────────────────────────────────────────────────────────
  const toggleListening = useCallback((isCurrentlyListening) => {
    if (isCurrentlyListening) {
      stopListening()
      dispatch({ type: 'SET_STATUS', status: 'idle' })
    } else {
      if (processingRef.current) return
      dispatch({ type: 'SET_STATUS', status: 'listening' })
      startListening()
    }
  }, [startListening, stopListening])

  // ── Interrupt agent speech ─────────────────────────────────────────────────
  const interrupt = useCallback(() => {
    stopSpeaking()
    processingRef.current = false
    dispatch({ type: 'SET_STATUS', status: 'listening' })
    startListening()
  }, [stopSpeaking, startListening])

  // ── Clear session ─────────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    stopSpeaking()
    stopListening()
    processingRef.current = false
    dispatch({ type: 'CLEAR_SESSION' })
  }, [stopSpeaking, stopListening])

  return {
    ...state,
    startSession,
    handleUserSpeech,
    handleTextInput,
    toggleListening,
    interrupt,
    clearSession,
  }
}
