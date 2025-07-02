import type { AxiosError } from "axios";
import type { HTTPError } from "ky";
import type { ErrorInfo } from "react";
import type { HTTP_ERROR_CONFIG } from "../constants/http-error-message";

export type ErrorConfigElementType =
  (typeof HTTP_ERROR_CONFIG)[keyof typeof HTTP_ERROR_CONFIG];

type OnErrorCallback = (
  error: HTTPError,
  info: ErrorInfo,
  statusCode: number,
) => void;

type DefaultErrorConfigType = {
  type: "default";
  onError?: OnErrorCallback;
} & Partial<
  Omit<ErrorConfigElementType, "action"> & {
    action: Partial<ErrorConfigElementType["action"]>;
  }
>;

type CustomErrorConfigType = {
  type: "custom";
  onError?: OnErrorCallback;
  fallback:
    | React.ReactNode
    | ((
        error: HTTPError | AxiosError,
        resetErrorBoundary: () => void,
      ) => React.ReactNode);
};

export type PartialErrorConfig = {
  [K in keyof typeof HTTP_ERROR_CONFIG]?:
    | DefaultErrorConfigType
    | CustomErrorConfigType;
};
