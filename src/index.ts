// Components
export { ApiErrorBoundary } from "./components/api-error-boundary";
export { GlobalErrorBoundary } from "./components/global-error-boundary";

// Types
export type {
  PartialErrorConfig,
  ErrorConfigElementType,
} from "./types/api-error";

// Utils
export { getErrorConfig } from "./utils/api-error";

// Constants (for customization)
export {
  HTTP_ERROR_CONFIG,
  HTTP_ERROR_ACTION_CONFIG,
} from "./constants/http-error-message";
