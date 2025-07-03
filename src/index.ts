// Components
export {
  ApiErrorBoundary,
  type TApiErrorBoundaryProps,
} from "./components/api-error-boundary";
export {
  ErrorBoundary,
  type TErrorBoundaryProps,
} from "./components/error-boundary";

export * from "react-error-boundary";
export { ErrorBoundary as BaseErrorBoundary } from "react-error-boundary";

// Types
export type {
  TPartialErrorConfig as PartialErrorConfig,
  TErrorConfigElementType as ErrorConfigElementType,
} from "./types/api-error";

// Utils
export { getErrorConfig } from "./utils/api-error";

// Constants (for customization)
export {
  HTTP_ERROR_CONFIG,
  HTTP_ERROR_ACTION_CONFIG,
} from "./constants/http-error-message";
