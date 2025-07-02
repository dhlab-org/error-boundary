'use client';

import type React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetErrorBoundary: () => void;
  }>;
}

const DefaultErrorFallback: React.FC<{
  error: Error;
  resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f9fafb',
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <h2 style={{ color: '#dc2626', marginBottom: '16px', fontSize: '20px' }}>
        예상치 못한 오류가 발생했습니다
      </h2>
      <details style={{ marginBottom: '20px', textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
          오류 상세정보
        </summary>
        <pre
          style={{
            fontSize: '12px',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px',
          }}
        >
          {error.message}
        </pre>
      </details>
      <button
        type='button'
        onClick={resetErrorBoundary}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        다시 시도하기
      </button>
    </div>
  </div>
);

export function GlobalErrorBoundary({
  children,
  fallback: Fallback = DefaultErrorFallback,
}: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
