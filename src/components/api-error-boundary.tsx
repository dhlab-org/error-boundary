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
import type { PartialErrorConfig } from "../types/api-error";
import { getErrorConfig, isApiError } from "../utils/api-error";

type IgnoreErrorType = string | number | ((error: HTTPError) => boolean);

const DefaultButton = (props: React.ComponentProps<"button">) => (
  <button
    type="button"
    className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded border ${props.className}`}
    {...props}
  >
    {props.children}
  </button>
);

type ApiErrorBoundaryProps = {
  children: React.ReactNode;
  FallbackContainer?: React.ComponentType<{ children: React.ReactNode }>;
  Button?: React.ComponentType<React.ComponentProps<"button">>;
  overrideConfig?: PartialErrorConfig;
  resetKeys?: ErrorBoundaryProps["resetKeys"];
  ignoreError?: IgnoreErrorType[];
};

export function ApiErrorBoundary({
  children,
  FallbackContainer = ({ children }) => (
    <div style={{ height: "100%" }}>{children}</div>
  ),
  Button = DefaultButton,
  overrideConfig,
  resetKeys,
  ignoreError = [],
}: ApiErrorBoundaryProps) {
  const handleError: ErrorBoundaryProps["onError"] = (error, info) => {
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
      "onError" in targetErrorConfig &&
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
  overrideConfig?: PartialErrorConfig;
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
    .with({ type: "default" }, () => {
      const message =
        "message" in targetErrorConfig
          ? targetErrorConfig.message
          : "오류가 발생했습니다.";
      const action =
        "action" in targetErrorConfig ? targetErrorConfig.action : null;

      return (
        <div className="flex flex-col items-center justify-center h-full p-4 gap-y-2">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={handleActionButtonClick}>
            {action?.message || "다시 시도하기"}
          </Button>
        </div>
      );
    })
    .with({ type: "custom" }, (config) => {
      const { fallback } = config;

      if (typeof fallback === "function") {
        return fallback(error, resetErrorBoundary);
      }

      return fallback;
    })
    .otherwise(() => null);
}
