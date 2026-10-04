import React, { useMemo } from 'react'

const statusConfig = {
  idle: {
    color: '#63b3ff',
    glow: 'rgba(99,179,255,0.15)',
    ringColor: 'rgba(99,179,255,0.12)',
    animate: 'breathe',
    label: 'Ready',
  },
  listening: {
    color: '#38f5c8',
    glow: 'rgba(56,245,200,0.2)',
    ringColor: 'rgba(56,245,200,0.15)',
    animate: 'pulse',
    label: 'Listening',
  },
  thinking: {
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.2)',
    ringColor: 'rgba(167,139,250,0.15)',
    animate: 'breathe',
    label: 'Thinking',
  },
  speaking: {
    color: '#63b3ff',
    glow: 'rgba(99,179,255,0.25)',
    ringColor: 'rgba(99,179,255,0.2)',
    animate: 'pulse',
    label: 'Speaking',
  },
  error: {
    color: '#ff6b6b',
    glow: 'rgba(255,107,107,0.2)',
    ringColor: 'rgba(255,107,107,0.15)',
    animate: 'breathe',
    label: 'Error',
  },
}

export function AgentOrb({ status }) {
  const cfg = statusConfig[status] || statusConfig.idle
  const bars = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])

  return (
    <div className="orb-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer rings */}
      {[180, 160, 140].map((size, i) => (
        <div
          key={size}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid ${cfg.ringColor}`,
            animation: `pulse-ring ${2 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            transition: 'border-color 0.6s ease',
          }}
        />
      ))}

      {/* Main orb */}
      <div
        style={{
          position: 'relative',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${cfg.color}33, ${cfg.color}11 60%, transparent)`,
          border: `1.5px solid ${cfg.color}44`,
          boxShadow: `0 0 40px ${cfg.glow}, 0 0 80px ${cfg.glow}55, inset 0 0 30px ${cfg.color}11`,
          animation: cfg.animate === 'breathe' ? 'breathe 3s ease-in-out infinite' : 'breathe 1.5s ease-in-out infinite',
          transition: 'box-shadow 0.6s ease, border-color 0.6s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Scan line for thinking/listening */}
        {(status === 'thinking' || status === 'listening') && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${cfg.color}88, transparent)`,
              animation: 'scan-line 2s linear infinite',
            }} />
          </div>
        )}

        {/* Audio bars for speaking/listening */}
        {(status === 'speaking' || status === 'listening') ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36 }}>
            {bars.map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: `${20 + Math.sin(i * 1.3) * 15}px`,
                  background: cfg.color,
                  borderRadius: 2,
                  animation: `wave-bar ${0.6 + (i % 5) * 0.12}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.08) % 0.5}s`,
                  opacity: 0.7 + (i % 3) * 0.1,
                }}
              />
            ))}
          </div>
        ) : status === 'thinking' ? (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: cfg.color,
                animation: `typing-dot 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        ) : (
          // Idle — Aria logo mark
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="6" stroke={cfg.color} strokeWidth="1.5" opacity="0.8" />
            <path d="M16 4 L16 10 M16 22 L16 28 M4 16 L10 16 M22 16 L28 16" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <circle cx="16" cy="16" r="2" fill={cfg.color} opacity="0.9" />
          </svg>
        )}
      </div>
    </div>
  )
}
