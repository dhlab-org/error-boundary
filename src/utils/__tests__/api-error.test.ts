import type { AxiosError } from "axios";
import { HTTPError } from "ky";
import { beforeAll, describe, expect, it } from "vitest";
import { HTTP_ERROR_CONFIG } from "../../constants/http-error-message";
import {
  getErrorConfig,
  isApiError,
  isAxiosError,
  isKyError,
} from "../api-error";

// Response Mock
class MockResponse {
  status: number;
  statusText: string;
  url: string;

  constructor(
    status: number,
    statusText = "Mock Error",
    url = "https://api.example.com/test",
  ) {
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

// Response를 mock
beforeAll(() => {
  globalThis.Response = MockResponse as any;
});

describe("api-error 유틸리티", () => {
  describe("isAxiosError", () => {
    it("유효한 AxiosError에 대해 true를 반환해야 함", () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed",
        response: {
          status: 404,
          statusText: "Not Found",
          data: null,
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        toJSON: () => ({}),
      };

      expect(isAxiosError(axiosError)).toBe(true);
    });

    it("AxiosError가 아닌 경우 false를 반환해야 함", () => {
      const regularError = new Error("Regular error");
      expect(isAxiosError(regularError)).toBe(false);
    });

    it("isAxiosError 속성이 없는 객체에 대해 false를 반환해야 함", () => {
      const fakeError = {
        name: "AxiosError",
        message: "Fake error",
      };
      expect(isAxiosError(fakeError)).toBe(false);
    });

    it("null 또는 undefined에 대해 false를 반환해야 함", () => {
      expect(isAxiosError(null)).toBe(false);
      expect(isAxiosError(undefined)).toBe(false);
    });
  });

  describe("isKyError", () => {
    it("유효한 HTTPError에 대해 true를 반환해야 함", () => {
      const mockResponse = new MockResponse(404);
      const kyError = new HTTPError(mockResponse as any, {} as any, {} as any);

      expect(isKyError(kyError)).toBe(true);
    });

    it("HTTPError가 아닌 경우 false를 반환해야 함", () => {
      const regularError = new Error("Regular error");
      expect(isKyError(regularError)).toBe(false);
    });

    it("올바른 name이 없는 객체에 대해 false를 반환해야 함", () => {
      const fakeError = {
        name: "SomeOtherError",
        response: new MockResponse(404),
      };
      expect(isKyError(fakeError)).toBe(false);
    });

    it("null 또는 undefined에 대해 false를 반환해야 함", () => {
      expect(isKyError(null)).toBe(false);
      expect(isKyError(undefined)).toBe(false);
    });
  });

  describe("isApiError", () => {
    it("AxiosError에 대해 true를 반환해야 함", () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed",
        response: {
          status: 404,
          statusText: "Not Found",
          data: null,
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        toJSON: () => ({}),
      };

      expect(isApiError(axiosError)).toBe(true);
    });

    it("HTTPError에 대해 true를 반환해야 함", () => {
      const mockResponse = new MockResponse(404);
      const kyError = new HTTPError(mockResponse as any, {} as any, {} as any);

      expect(isApiError(kyError)).toBe(true);
    });

    it("일반 Error에 대해 false를 반환해야 함", () => {
      const regularError = new Error("Regular error");
      expect(isApiError(regularError)).toBe(false);
    });
  });

  describe("getErrorConfig", () => {
    it("404 에러에 대해 올바른 설정을 반환해야 함", () => {
      const mockResponse = new MockResponse(404);
      const error = new HTTPError(mockResponse as any, {} as any, {} as any);

      const config = getErrorConfig(error);

      expect(config).toEqual(HTTP_ERROR_CONFIG[404]);
    });

    it("알 수 없는 상태 코드에 대해 500 설정을 반환해야 함", () => {
      const mockResponse = new MockResponse(999); // Unknown status code
      const error = new HTTPError(mockResponse as any, {} as any, {} as any);

      const config = getErrorConfig(error);

      expect(config).toEqual(HTTP_ERROR_CONFIG[500]);
    });

    it("오버라이드 설정이 제공되면 해당 설정을 반환해야 함", () => {
      const mockResponse = new MockResponse(404);
      const error = new HTTPError(mockResponse as any, {} as any, {} as any);
      const overrideConfig = {
        404: {
          type: "custom" as const,
          fallback: "Custom 404",
        },
      };

      const config = getErrorConfig(error, overrideConfig);

      expect(config).toEqual(overrideConfig[404]);
    });

    it("AxiosError를 올바르게 처리해야 함", () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed",
        response: {
          status: 401,
          statusText: "Unauthorized",
          data: null,
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        toJSON: () => ({}),
      };

      const config = getErrorConfig(axiosError);

      expect(config).toEqual(HTTP_ERROR_CONFIG[401]);
    });

    it("에러에 response가 없을 때 기본값으로 500을 사용해야 함", () => {
      const axiosError: AxiosError = {
        isAxiosError: true,
        name: "AxiosError",
        message: "Network Error",
        config: {} as any,
        toJSON: () => ({}),
      };

      const config = getErrorConfig(axiosError);

      expect(config).toEqual(HTTP_ERROR_CONFIG[500]);
    });

    it("기본 설정보다 오버라이드 설정을 우선해야 함", () => {
      const mockResponse = new MockResponse(401);
      const error = new HTTPError(mockResponse as any, {} as any, {} as any);
      const overrideConfig = {
        401: {
          type: "custom" as const,
          fallback: "커스텀 에러 UI",
        },
      };

      const config = getErrorConfig(error, overrideConfig);

      expect(config).toEqual(overrideConfig[401]);
    });
  });
});
