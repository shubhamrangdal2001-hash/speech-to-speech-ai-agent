import { useRef, useState, useCallback, useEffect } from 'react'
import { SPEECH_CONFIG } from './agentConfig.js'

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition

/**
 * useSpeechRecognition
 * Returns controls + state for the Web Speech API recognition.
 */
export function useSpeechRecognition({ onFinalTranscript, onInterimTranscript }) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(() => Boolean(SpeechRecognition))
  const [interimText, setInterimText] = useState('')
  const accumulatedRef = useRef('')

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const stopListening = useCallback(() => {
    clearSilenceTimer()
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [clearSilenceTimer])

  const startListening = useCallback(() => {
    if (!isSupported) return
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (_) {}
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = SPEECH_CONFIG.recognition.interimResults
    rec.lang = SPEECH_CONFIG.recognition.lang
    recognitionRef.current = rec
    accumulatedRef.current = ''

    rec.onstart = () => {
      setIsListening(true)
      setInterimText('')
    }

    rec.onresult = (event) => {
      clearSilenceTimer()
      let interim = ''
      let finalChunk = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalChunk += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (finalChunk) {
        accumulatedRef.current += finalChunk
      }

      const displayText = accumulatedRef.current + interim
      setInterimText(displayText)
      if (onInterimTranscript) onInterimTranscript(displayText)

      // Reset silence timer
      silenceTimerRef.current = setTimeout(() => {
        const final = accumulatedRef.current.trim() || interim.trim()
        if (final) {
          rec.stop()
          if (onFinalTranscript) onFinalTranscript(final)
        }
      }, SPEECH_CONFIG.recognition.silenceTimeout)
    }

    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.warn('Speech recognition error:', event.error)
      setIsListening(false)
    }

    rec.onend = () => {
      clearSilenceTimer()
      setIsListening(false)
      setInterimText('')
    }

    rec.start()
  }, [isSupported, onFinalTranscript, onInterimTranscript, clearSilenceTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer()
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (_) {}
      }
    }
  }, [clearSilenceTimer])

  return { startListening, stopListening, isListening, isSupported, interimText }
}
