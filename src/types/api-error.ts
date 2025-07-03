import type { AxiosError } from "axios";
import type { HTTPError } from "ky";
import type { ErrorInfo } from "react";
import type { HTTP_ERROR_CONFIG } from "../constants/http-error-message";

export type TErrorConfigElementType =
  (typeof HTTP_ERROR_CONFIG)[keyof typeof HTTP_ERROR_CONFIG];

type TOnErrorCallback = (
  error: HTTPError | AxiosError,
  info: ErrorInfo,
  statusCode: number,
) => void;

type TDefaultErrorConfigType = {
  type: "default";
  onError?: TOnErrorCallback;
} & Partial<
  Omit<TErrorConfigElementType, "action" | "message"> & {
    action: Partial<TErrorConfigElementType["action"]>;
    message: string;
  }
>;

type TCustomErrorConfigType = {
  type: "custom";
  onError?: TOnErrorCallback;
  fallback:
    | React.ReactNode
    | ((
        error: HTTPError | AxiosError,
        resetErrorBoundary: () => void,
      ) => React.ReactNode);
};

export type TPartialErrorConfig = {
  [K in keyof typeof HTTP_ERROR_CONFIG]?:
    | ({ type: "default" } & TDefaultErrorConfigType)
    | ({ type: "custom" } & TCustomErrorConfigType);
};
