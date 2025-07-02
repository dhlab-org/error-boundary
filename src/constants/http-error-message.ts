export const HTTP_ERROR_ACTION_CONFIG = {
  goBack: {
    type: "go-back",
    message: "이전 페이지로 돌아가기",
  },
  goLogin: {
    type: "go-login",
    message: "로그인 페이지로 이동",
  },
  retry: {
    type: "retry",
    message: "다시 시도하기",
  },
  goRoot: {
    type: "go-root",
    message: "홈으로 이동",
  },
} as const;

const HTTP_CLIENT_ERROR_CONFIG = {
  400: {
    name: "Bad Request",
    message: "잘못된 요청입니다.",
    action: HTTP_ERROR_ACTION_CONFIG.goBack,
  },
  401: {
    name: "Unauthorized",
    message: "로그인이 필요합니다.",
    action: HTTP_ERROR_ACTION_CONFIG.goLogin,
  },
  403: {
    name: "Forbidden",
    message: "권한이 없습니다.",
    action: HTTP_ERROR_ACTION_CONFIG.goBack,
  },
  404: {
    name: "Not Found",
    message: "요청하신 리소스를 찾을 수 없습니다.",
    action: HTTP_ERROR_ACTION_CONFIG.goBack,
  },
  409: {
    name: "Conflict",
    message: "이미 존재하는 리소스입니다.",
    action: HTTP_ERROR_ACTION_CONFIG.goRoot,
  },
} as const;

const HTTP_SERVER_ERROR_CONFIG = {
  500: {
    name: "Internal Server Error",
    message: "잠시 후 다시 시도해주세요.",
    action: HTTP_ERROR_ACTION_CONFIG.retry,
  },
};

export const HTTP_ERROR_CONFIG = {
  ...HTTP_CLIENT_ERROR_CONFIG,
  ...HTTP_SERVER_ERROR_CONFIG,
} as const;
