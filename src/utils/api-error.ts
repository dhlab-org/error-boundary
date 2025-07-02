import type { HTTPError } from 'ky';
import { HTTP_ERROR_CONFIG } from '../constants/http-error-message';
import type { PartialErrorConfig } from '../types/api-error';

export const getErrorConfig = (
  error: HTTPError,
  overrideConfig?: PartialErrorConfig,
) => {
  const statusCode = error.response.status;
  const statusCodeKey = Object.keys(HTTP_ERROR_CONFIG).includes(
    statusCode.toString(),
  )
    ? statusCode
    : 500;

  const defaultConfig =
    HTTP_ERROR_CONFIG[statusCodeKey as keyof typeof HTTP_ERROR_CONFIG];
  const override =
    overrideConfig?.[statusCodeKey as keyof typeof HTTP_ERROR_CONFIG];

  // 오버라이드가 있다면 사용, 없다면 기본 설정 사용
  return override || defaultConfig;
};
