"use client";

import type React from "react";
import type { ErrorInfo } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

export type TErrorBoundaryProps = React.ComponentProps<
  typeof ReactErrorBoundary
> & {
  ignoreError?: Array<string | number | ((error: Error) => boolean)>;
};

export function ErrorBoundary({
  children,
  ignoreError = [],
  onError,
  ...rest
}: TErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    const shouldIgnore = ignoreError.some((ignore) => {
      if (typeof ignore === "string") {
        return error.message.includes(ignore);
      }
      if (typeof ignore === "number") {
        return error.name === ignore.toString();
      }
      if (typeof ignore === "function") {
        return ignore(error);
      }
      return false;
    });

    if (shouldIgnore) {
      throw error;
    }

    onError?.(error, errorInfo);
  };

  return (
    <ReactErrorBoundary {...rest} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
}
