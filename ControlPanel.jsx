import React, { useState } from 'react'

// Simple icon components
const MicIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
)

const MicOffIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" x2="22" y1="2" y2="22"/>
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/>
    <path d="M5 10v2a7 7 0 0 0 12 5"/>
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
)

const StopIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
  </svg>
)

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const SendIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" x2="11" y1="2" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

export function ControlPanel({
  agentStatus,
  isListening,
  isSpeaking,
  isSupported,
  onToggleMic,
  onInterrupt,
  onClear,
  onTextSubmit,
}) {
  const [inputText, setInputText] = useState('')
  const isBusy = agentStatus === 'thinking'

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed || isBusy) return
    onTextSubmit(trimmed)
    setInputText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      {/* Primary mic button */}
      <div style={{ position: 'relative' }}>
        {/* Interrupt ring shown while speaking */}
        {isSpeaking && (
          <button
            onClick={onInterrupt}
            title="Interrupt"
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: '50%',
              border: '1.5px dashed rgba(255,107,107,0.4)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,107,107,0.5)',
              fontSize: 10,
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-body)',
            }}
          >
          </button>
        )}

        <button
          onClick={() => isSpeaking ? onInterrupt() : onToggleMic()}
          disabled={isBusy}
          title={isListening ? 'Stop listening' : isSpeaking ? 'Interrupt' : 'Start speaking'}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: 'none',
            cursor: isBusy ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s ease',
            background: isListening
              ? 'linear-gradient(135deg, #38f5c8, #63b3ff)'
              : isSpeaking
              ? 'linear-gradient(135deg, #ff6b6b88, #ff6b6b44)'
              : isBusy
              ? 'rgba(167,139,250,0.15)'
              : 'linear-gradient(135deg, rgba(99,179,255,0.25), rgba(99,179,255,0.1))',
            boxShadow: isListening
              ? '0 0 30px rgba(56,245,200,0.4), 0 0 60px rgba(56,245,200,0.15)'
              : isSpeaking
              ? '0 0 20px rgba(255,107,107,0.3)'
              : '0 4px 20px rgba(0,0,0,0.3)',
            color: isListening ? '#05080f' : isSpeaking ? '#ff6b6b' : isBusy ? 'rgba(167,139,250,0.5)' : 'var(--accent-blue)',
            transform: isListening ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {isSpeaking ? <StopIcon size={22} /> : isListening ? <MicIcon size={22} /> : <MicIcon size={22} />}
        </button>
      </div>

      {/* Text input fallback */}
      <div style={{
        display: 'flex',
        gap: 8,
        width: '100%',
        maxWidth: 440,
        alignItems: 'center',
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isSupported ? 'Or type a message...' : 'Type a message (voice not supported)'}
          disabled={isBusy || isListening}
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isBusy || !inputText.trim() || isListening}
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: inputText.trim() && !isBusy ? 'rgba(99,179,255,0.15)' : 'rgba(255,255,255,0.03)',
            color: inputText.trim() && !isBusy ? 'var(--accent-blue)' : 'var(--text-muted)',
            cursor: inputText.trim() && !isBusy ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          <SendIcon size={16} />
        </button>
        <button
          onClick={onClear}
          title="Clear conversation"
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          <TrashIcon size={16} />
        </button>
      </div>

      {/* Hint text */}
      {!isSupported && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--danger)',
          opacity: 0.7,
          letterSpacing: '0.05em',
        }}>
          Voice recognition not supported in this browser. Use text input.
        </p>
      )}
    </div>
  )
}
