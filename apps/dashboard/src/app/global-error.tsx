/**
 * Global error boundary for root-level errors
 * Styled according to Pravado Design System v2
 * Note: This must include its own <html> and <body> since it replaces the root layout
 */

'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        backgroundColor: '#0B0F14', /* --slate-0 */
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          position: 'relative',
        }}>
          {/* Background gradient */}
          <div style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.3,
            background: 'radial-gradient(ellipse at 50% 0%, #FF6B6B 0%, transparent 50%)',
          }} />

          {/* Error Card */}
          <div style={{
            position: 'relative',
            maxWidth: '28rem',
            textAlign: 'center',
            backgroundColor: 'rgba(18, 25, 35, 0.7)', /* --slate-2 with opacity */
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)', /* --border-subtle */
            borderRadius: '24px', /* --radius-2xl */
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)', /* --elev-3 */
            padding: '2rem',
          }}>
            {/* Error Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="32" height="32" fill="none" stroke="#FF6B6B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#EAF2F7', /* --white-0 */
              marginBottom: '0.5rem',
            }}>
              Critical Error
            </h1>

            <p style={{
              fontSize: '1.125rem',
              color: '#3B4E67', /* --slate-6 */
              marginBottom: '1.5rem',
            }}>
              Something went seriously wrong
            </p>

            {/* Error Message */}
            {error.message && (
              <div style={{
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.2)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: '#FF6B6B',
                fontSize: '0.875rem',
              }}>
                {error.message}
              </div>
            )}

            {/* Retry Button */}
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6A6FF9', /* --brand-iris */
                color: 'white',
                border: 'none',
                borderRadius: '10px', /* --radius-sm */
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 180ms ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(106, 111, 249, 0.9)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#6A6FF9';
              }}
            >
              Try again
            </button>

            {/* Help text */}
            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: '#3B4E67', /* --slate-6 */
            }}>
              If this problem persists, please contact{' '}
              <a
                href="mailto:support@pravado.com"
                style={{ color: '#38E1FF', textDecoration: 'none' }}
              >
                support@pravado.com
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
