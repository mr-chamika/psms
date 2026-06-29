'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #fff5f5 100%)',
          color: '#111827',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
          {/* Red badge icon */}
          <div
            style={{
              margin: '0 auto 24px',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 12px rgba(254,226,226,0.4), 0 8px 30px rgba(239,68,68,0.12)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 12px',
            }}
          >
            Critical Error
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#6b7280',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            A critical error occurred and the application could not recover.
            Please try refreshing the page.
          </p>

          {/* Error detail */}
          {error?.message && (
            <div
              style={{
                textAlign: 'left',
                background: 'rgba(254,242,242,0.7)',
                border: '1px solid #fecaca',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#f87171',
                  margin: '0 0 6px',
                }}
              >
                Error Details
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: '#b91c1c',
                  lineHeight: 1.5,
                  margin: 0,
                  wordBreak: 'break-word',
                }}
              >
                {error.message}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: '#111827',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(17,24,39,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                ;(e.target as HTMLButtonElement).style.background = '#1f2937'
                ;(e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                ;(e.target as HTMLButtonElement).style.background = '#111827'
                ;(e.target as HTMLButtonElement).style.transform = 'translateY(0)'
              }}
            >
              ↻ Try Again
            </button>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                cursor: 'pointer',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                ;(e.target as HTMLAnchorElement).style.background = '#f9fafb'
                ;(e.target as HTMLAnchorElement).style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                ;(e.target as HTMLAnchorElement).style.background = '#fff'
                ;(e.target as HTMLAnchorElement).style.transform = 'translateY(0)'
              }}
            >
              ← Back to Dashboard
            </a>
          </div>

          <p
            style={{
              marginTop: 40,
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            If this issue persists, please contact the system administrator.
          </p>
        </div>
      </body>
    </html>
  )
}
