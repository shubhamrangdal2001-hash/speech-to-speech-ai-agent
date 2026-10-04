import React, { useCallback, useEffect, useRef } from 'react'
import { AGENT_CONFIG, SPEECH_CONFIG } from './agentConfig.js'
import { useConversation } from './useConversation.js'
import { useSpeechRecognition } from './useSpeechRecognition.js'
import { AgentOrb } from './AgentOrb.jsx'
import { ControlPanel } from './ControlPanel.jsx'
import { MessageBubble } from './MessageBubble.jsx'
import { StatusBar } from './StatusBar.jsx'

// ─── Text-to-Speech helper ──────────────────────────────────────────────────
function useSpeechSynthesis() {
  const utteranceRef = useRef(null)

  const speak = useCallback((text, { onEnd } = {}) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.rate   = SPEECH_CONFIG.synthesis.rate
    utter.pitch  = SPEECH_CONFIG.synthesis.pitch
    utter.volume = SPEECH_CONFIG.synthesis.volume

    // Pick preferred voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferred = SPEECH_CONFIG.synthesis.preferredVoices
    const match = voices.find((v) => preferred.some((p) => v.name.includes(p)))
    if (match) utter.voice = match

    if (onEnd) utter.onend = onEnd
    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }, [])

  const isSpeaking = () => window.speechSynthesis?.speaking ?? false

  return { speak, stopSpeaking, isSpeaking }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const messagesEndRef = useRef(null)
  const { speak, stopSpeaking, isSpeaking } = useSpeechSynthesis()

  // Speech recognition — wired below after conversation hook is ready
  const handleFinalRef   = useRef(null)
  const handleInterimRef = useRef(null)

  const { startListening, stopListening, isListening, isSupported, interimText } =
    useSpeechRecognition({
      onFinalTranscript:   (t) => handleFinalRef.current?.(t),
      onInterimTranscript: (t) => handleInterimRef.current?.(t),
    })

  const conversation = useConversation({
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  })

  // Wire up the final transcript callback after hook is initialized
  useEffect(() => {
    handleFinalRef.current = conversation.handleUserSpeech
  }, [conversation.handleUserSpeech])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages])

  const speaking = isSpeaking()

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--bg-deep)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Ambient background glows ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', top: '-20%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(99,179,255,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', bottom: '5%', right: '-10%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
        }} />
      </div>

      {/* ── Header ── */}
      <header style={{
        width: '100%', maxWidth: 680,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 28px 0',
        flexShrink: 0,
        position: 'relative', zIndex: 1,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18, fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            {AGENT_CONFIG.name}
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            marginTop: 2,
          }}>
            {AGENT_CONFIG.domainFocus.toUpperCase()}
          </p>
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: conversation.sessionStarted ? 'var(--success)' : 'var(--text-muted)',
            boxShadow: conversation.sessionStarted ? '0 0 8px var(--success)' : 'none',
            transition: 'all 0.4s',
          }} />
          {conversation.sessionStarted ? 'SESSION ACTIVE' : 'STANDBY'}
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{
        flex: 1, width: '100%', maxWidth: 680,
        display: 'flex', flexDirection: 'column',
        padding: '0 28px',
        overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        {!conversation.sessionStarted ? (
          /* ── Welcome / Start screen ── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 36,
          }}>
            <AgentOrb status="idle" />

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 26, fontStyle: 'italic',
                color: 'var(--text-primary)',
                lineHeight: 1.4, marginBottom: 10,
              }}>
                Meet {AGENT_CONFIG.name}
              </p>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                lineHeight: 1.8,
                maxWidth: 340,
                margin: '0 auto',
              }}>
                A real-time voice AI agent. Speak naturally or type — {AGENT_CONFIG.name} listens, thinks, and responds.
              </p>
            </div>

            <button
              id="start-session-btn"
              onClick={conversation.startSession}
              style={{
                padding: '14px 40px',
                borderRadius: 50,
                border: '1px solid rgba(99,179,255,0.3)',
                background: 'linear-gradient(135deg, rgba(99,179,255,0.15), rgba(99,179,255,0.05))',
                color: 'var(--accent-blue)',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 0 24px rgba(99,179,255,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,179,255,0.25), rgba(99,179,255,0.1))'
                e.currentTarget.style.boxShadow = '0 0 40px rgba(99,179,255,0.2)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,179,255,0.15), rgba(99,179,255,0.05))'
                e.currentTarget.style.boxShadow = '0 0 24px rgba(99,179,255,0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              START SESSION
            </button>
          </div>
        ) : (
          /* ── Active session view ── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            paddingTop: 20, gap: 16, overflow: 'hidden',
          }}>
            {/* Orb + status */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 16, flexShrink: 0,
            }}>
              <AgentOrb status={conversation.agentStatus} />
              <StatusBar
                status={conversation.agentStatus}
                interimText={interimText}
              />
            </div>

            {/* Error banner */}
            {conversation.error && (
              <div style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: 'rgba(255,107,107,0.08)',
                border: '1px solid rgba(255,107,107,0.2)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--danger)',
                letterSpacing: '0.03em',
              }}>
                ⚠ {conversation.error}
              </div>
            )}

            {/* Message feed */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: '4px 2px 8px',
            }}>
              {conversation.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Control panel */}
            <div style={{ flexShrink: 0, paddingBottom: 20 }}>
              <ControlPanel
                agentStatus={conversation.agentStatus}
                isListening={isListening}
                isSpeaking={speaking}
                isSupported={isSupported}
                onToggleMic={() => conversation.toggleListening(isListening)}
                onInterrupt={conversation.interrupt}
                onClear={conversation.clearSession}
                onTextSubmit={conversation.handleTextInput}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
