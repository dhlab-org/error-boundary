import type { AxiosError } from "axios";
import type { HTTPError } from "ky";
import { HTTP_ERROR_CONFIG } from "../constants/http-error-message";
import type { TPartialErrorConfig } from "../types/api-error";

export const getErrorConfig = (
  error: HTTPError | AxiosError,
  overrideConfig?: TPartialErrorConfig,
) => {
  const statusCode = Object.keys(HTTP_ERROR_CONFIG).includes(
    error.response?.status?.toString() ?? "",
  )
    ? error.response?.status
    : 500;

  const defaultConfig =
    HTTP_ERROR_CONFIG[statusCode as keyof typeof HTTP_ERROR_CONFIG];
  const override =
    overrideConfig?.[statusCode as keyof typeof HTTP_ERROR_CONFIG];

  return override ?? defaultConfig;
};

export const isAxiosError = (err: unknown): err is AxiosError => {
  return (
    typeof err === "object" &&
    err !== null &&
    "isAxiosError" in err &&
    err.isAxiosError === true
  );
};

export const isKyError = (err: unknown): err is HTTPError => {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    err.name === "HTTPError" &&
    "response" in err &&
    err.response instanceof Response
  );
};

export const isApiError = (err: unknown) => {
  return isAxiosError(err) || isKyError(err);
};
