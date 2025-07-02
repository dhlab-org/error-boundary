'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import type React from 'react';
import {
  ErrorBoundary,
  type ErrorBoundaryProps,
  type FallbackProps,
} from 'react-error-boundary';
import { P, match } from 'ts-pattern';
import type { PartialErrorConfig } from '../types/api-error';
import { getErrorConfig } from '../utils/api-error';

type IgnoreErrorType = string | number | ((error: HTTPError) => boolean);

interface DefaultButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const DefaultButton: React.FC<DefaultButtonProps> = ({
  onClick,
  children,
  className = '',
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded border ${className}`}
    style={{
      cursor: 'pointer',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      padding: '8px 16px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
    }}
  >
    {children}
  </button>
);

type ApiErrorBoundaryProps = {
  children: React.ReactNode;
  FallbackContainer?: React.ComponentType<{ children: React.ReactNode }>;
  Button?: React.ComponentType<DefaultButtonProps>;
  overrideConfig?: PartialErrorConfig;
  resetKeys?: ErrorBoundaryProps['resetKeys'];
  ignoreError?: IgnoreErrorType[];
  className?: string;
};

export function ApiErrorBoundary({
  children,
  FallbackContainer = ({ children }) => (
    <div style={{ height: '100%' }}>{children}</div>
  ),
  Button = DefaultButton,
  overrideConfig,
  resetKeys,
  ignoreError = [],
  className = '',
}: ApiErrorBoundaryProps) {
  const handleError: ErrorBoundaryProps['onError'] = (error, info) => {
    if (!(error instanceof HTTPError)) {
      throw error;
    }

    const shouldIgnore = ignoreError.some((ignore) =>
      match(ignore)
        .with(P.string, (ignoreStatusText) =>
          error.response.statusText.match(ignoreStatusText),
        )
        .with(
          P.number,
          (ignoreStatus) => error.response.status === ignoreStatus,
        )
        .with(P.instanceOf(Function), (ignoreErrorFunction) =>
          ignoreErrorFunction(error),
        )
        .otherwise(() => false),
    );

    if (shouldIgnore) {
      throw error;
    }

    const targetErrorConfig = getErrorConfig(error, overrideConfig);
    if (
      targetErrorConfig &&
      'onError' in targetErrorConfig &&
      targetErrorConfig.onError
    ) {
      targetErrorConfig.onError(error, info, error.response.status);
    }
  };

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) =>
            error instanceof HTTPError ? (
              <FallbackContainer>
                <ApiErrorFallback
                  error={error}
                  resetErrorBoundary={resetErrorBoundary}
                  overrideConfig={overrideConfig}
                  Button={Button}
                  className={className}
                />
              </FallbackContainer>
            ) : null
          }
          onError={handleError}
          onReset={reset}
          resetKeys={[
            typeof window !== 'undefined' ? window.location.pathname : '',
            ...(resetKeys ?? []),
          ]}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

type ApiErrorFallbackProps = {
  error: HTTPError;
  resetErrorBoundary: FallbackProps['resetErrorBoundary'];
  overrideConfig?: PartialErrorConfig;
  Button: React.ComponentType<DefaultButtonProps>;
  className?: string;
};

function ApiErrorFallback({
  error,
  resetErrorBoundary,
  overrideConfig,
  Button,
  className,
}: ApiErrorFallbackProps) {
  const targetErrorConfig = getErrorConfig(error, overrideConfig);

  const handleActionButtonClick = () => {
    if (
      !targetErrorConfig ||
      !('action' in targetErrorConfig) ||
      !targetErrorConfig.action
    ) {
      return;
    }

    match(targetErrorConfig.action.type)
      .with('go-back', () => {
        if (typeof window !== 'undefined') {
          window.history.back();
        }
      })
      .with('go-login', () => {
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/login');
        }
      })
      .with('retry', () => {
        resetErrorBoundary();
      })
      .with('go-root', () => {
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/');
        }
      });
  };

  if (!targetErrorConfig) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '16px',
          gap: '8px',
        }}
      >
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
          오류가 발생했습니다.
        </p>
        <Button onClick={resetErrorBoundary}>다시 시도하기</Button>
      </div>
    );
  }

  return match(targetErrorConfig)
    .with({ type: 'default' }, () => {
      const message =
        'message' in targetErrorConfig
          ? targetErrorConfig.message
          : '오류가 발생했습니다.';
      const action =
        'action' in targetErrorConfig ? targetErrorConfig.action : null;

      return (
        <div
          className={className}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '16px',
            gap: '8px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '8px',
            }}
          >
            {message}
          </p>
          <Button onClick={handleActionButtonClick}>
            {action?.message || '다시 시도하기'}
          </Button>
        </div>
      );
    })
    .with({ type: 'custom' }, (config) => config.fallback)
    .otherwise(() => (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '16px',
          gap: '8px',
        }}
      >
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
          오류가 발생했습니다.
        </p>
        <Button onClick={resetErrorBoundary}>다시 시도하기</Button>
      </div>
    ));
}
