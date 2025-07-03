"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { HTTPError } from "ky";
import type React from "react";
import {
  ErrorBoundary,
  type ErrorBoundaryProps,
  type FallbackProps,
} from "react-error-boundary";
import { P, match } from "ts-pattern";
import type { TPartialErrorConfig } from "../types/api-error";
import { getErrorConfig, isApiError } from "../utils/api-error";

export type TIgnoreErrorType =
  | string
  | number
  | ((error: HTTPError | AxiosError) => boolean);

const DefaultButton = (props: React.ComponentProps<"button">) => (
  <button
    type="button"
    className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded border ${props.className}`}
    {...props}
  >
    {props.children}
  </button>
);

export type TApiErrorBoundaryProps = {
  children: React.ReactNode;
  FallbackContainer?: React.ComponentType<{ children: React.ReactNode }>;
  Button?: React.ComponentType<React.ComponentProps<"button">>;
  overrideConfig?: TPartialErrorConfig;
  resetKeys?: ErrorBoundaryProps["resetKeys"];
  ignoreError?: TIgnoreErrorType[];
};

export function ApiErrorBoundary({
  children,
  FallbackContainer = ({ children }) => (
    <div className="h-full">{children}</div>
  ),
  Button = DefaultButton,
  overrideConfig,
  resetKeys,
  ignoreError = [],
}: TApiErrorBoundaryProps) {
  const handleError: ErrorBoundaryProps["onError"] = (error, info) => {
    if (!isApiError(error)) {
      throw error;
    }

    const shouldIgnore = ignoreError.some((ignore) =>
      match(ignore)
        .with(P.string, (ignoreStatusText) => {
          const statusText =
            error instanceof HTTPError
              ? error.response.statusText
              : error.response?.statusText || "";
          return statusText.match(ignoreStatusText);
        })
        .with(P.number, (ignoreStatus) => {
          const status =
            error instanceof HTTPError
              ? error.response.status
              : error.response?.status || 0;
          return status === ignoreStatus;
        })
        .with(P.instanceOf(Function), (ignoreErrorFunction) =>
          ignoreErrorFunction(error as HTTPError | AxiosError),
        )
        .otherwise(() => false),
    );

    if (shouldIgnore) {
      throw error;
    }

    const targetErrorConfig = getErrorConfig(error, overrideConfig);
    if (
      targetErrorConfig &&
      "onError" in targetErrorConfig &&
      targetErrorConfig.onError
    ) {
      const status =
        error instanceof HTTPError
          ? error.response.status
          : error.response?.status || 500;
      targetErrorConfig.onError(error, info, status);
    }
  };

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) =>
            isApiError(error) ? (
              <FallbackContainer>
                <ApiErrorFallback
                  error={error}
                  resetErrorBoundary={resetErrorBoundary}
                  overrideConfig={overrideConfig}
                  Button={Button}
                />
              </FallbackContainer>
            ) : null
          }
          onError={handleError}
          onReset={reset}
          resetKeys={[
            typeof window !== "undefined" ? window.location.pathname : "",
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
  error: HTTPError | AxiosError;
  resetErrorBoundary: FallbackProps["resetErrorBoundary"];
  overrideConfig?: TPartialErrorConfig;
  Button: React.ComponentType<React.ComponentProps<"button">>;
};

function ApiErrorFallback({
  error,
  resetErrorBoundary,
  overrideConfig,
  Button,
}: ApiErrorFallbackProps) {
  const targetErrorConfig = getErrorConfig(error, overrideConfig);

  const handleActionButtonClick = () => {
    if (
      !targetErrorConfig ||
      !("action" in targetErrorConfig) ||
      !targetErrorConfig.action
    ) {
      return;
    }

    match(targetErrorConfig.action.type)
      .with("go-back", () => {
        if (typeof window !== "undefined") {
          window.history.back();
        }
      })
      .with("go-login", () => {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "/login");
        }
      })
      .with("retry", () => {
        resetErrorBoundary();
      })
      .with("go-root", () => {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "/");
        }
      });
  };

  return match(targetErrorConfig)
    .with(
      { type: "default", action: { message: P._ }, message: P._ },
      ({ action, message }) => {
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 gap-y-2">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={handleActionButtonClick}>{action.message}</Button>
          </div>
        );
      },
    )
    .with({ type: "custom" }, (config) => {
      const { fallback } = config;

      if (typeof fallback === "function") {
        return fallback(error, resetErrorBoundary);
      }

      return fallback;
    })
    .otherwise(() => null);
}
