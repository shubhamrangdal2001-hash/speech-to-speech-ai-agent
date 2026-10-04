import React from 'react'

function formatTime(date) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        animation: 'fade-in-up 0.35s ease forwards',
        marginBottom: 4,
      }}
    >
      {/* Role label */}
      <div style={{
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: isUser ? 'rgba(99,179,255,0.5)' : 'rgba(56,245,200,0.5)',
        marginBottom: 6,
        fontFamily: 'var(--font-body)',
        paddingLeft: isUser ? 0 : 2,
        paddingRight: isUser ? 2 : 0,
      }}>
        {isUser ? 'You' : 'Aria'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '80%',
        padding: '12px 16px',
        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        background: isUser
          ? 'linear-gradient(135deg, rgba(99,179,255,0.15) 0%, rgba(99,179,255,0.08) 100%)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isUser ? 'rgba(99,179,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(8px)',
      }}>
        <p style={{
          fontFamily: isUser ? 'var(--font-body)' : 'var(--font-serif)',
          fontSize: isUser ? 13 : 15,
          lineHeight: 1.65,
          color: isUser ? 'var(--text-secondary)' : 'var(--text-primary)',
          fontStyle: isUser ? 'normal' : 'normal',
          margin: 0,
        }}>
          {message.content}
        </p>
      </div>

      {/* Timestamp */}
      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 4,
        fontFamily: 'var(--font-body)',
        paddingRight: isUser ? 2 : 0,
        paddingLeft: isUser ? 0 : 2,
      }}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  )
}
