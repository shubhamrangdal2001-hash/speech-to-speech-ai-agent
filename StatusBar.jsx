import React from 'react'

const statusMap = {
  idle:      { label: 'Ready — tap the mic to speak', color: 'var(--accent-blue)', blink: false },
  listening: { label: 'Listening...', color: 'var(--accent-cyan)', blink: true },
  thinking:  { label: 'Thinking...', color: 'var(--accent-violet)', blink: true },
  speaking:  { label: 'Speaking', color: 'var(--accent-blue)', blink: false },
  error:     { label: 'Something went wrong', color: 'var(--danger)', blink: true },
}

export function StatusBar({ status, interimText }) {
  const cfg = statusMap[status] || statusMap.idle

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      borderRadius: 50,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(8px)',
      minWidth: 200,
      maxWidth: '80%',
      transition: 'all 0.3s ease',
    }}>
      {/* Dot */}
      <div style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
        boxShadow: `0 0 8px ${cfg.color}88`,
        animation: cfg.blink ? 'status-blink 1.2s ease-in-out infinite' : 'none',
        transition: 'background 0.4s ease',
      }} />

      {/* Text */}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        color: 'var(--text-secondary)',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 260,
        transition: 'color 0.3s ease',
      }}>
        {status === 'listening' && interimText
          ? `"${interimText.slice(-60)}${interimText.length > 60 ? '…' : ''}"`
          : cfg.label}
      </span>
    </div>
  )
}
