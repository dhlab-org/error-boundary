import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { HTTPError } from "ky";
import type React from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { TPartialErrorConfig } from "../../types/api-error";
import { ApiErrorBoundary } from "../api-error-boundary";

// Mock HTTPError (실제 HTTPError를 사용하되 Response 객체 생성)
class MockHTTPError extends HTTPError {
  constructor(status: number, statusText = "Error") {
    const mockResponse = new Response(null, {
      status,
      statusText,
    });
    super(mockResponse, {} as any, {} as any);
  }
}

// Mock AxiosError (실제 AxiosError를 사용)
const createMockAxiosError = (
  status: number,
  statusText = "Error",
): AxiosError => {
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    {} as any,
    {} as any,
    {
      status,
      statusText,
      data: null,
      headers: {},
      config: {} as any,
    },
  );
  return error;
};

// 테스트용 QueryClient 생성
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

// Mock 컴포넌트들
const NormalComponent = () => <div>정상적인 컴포넌트</div>;

const KyErrorComponent = ({ status = 404 }: { status?: number }) => {
  const error = new MockHTTPError(status);
  throw error;
};

const AxiosErrorComponent = ({ status = 404 }: { status?: number }) => {
  const error = createMockAxiosError(status);
  throw error;
};

const GenericErrorComponent = () => {
  throw new Error("Generic error");
};

describe("ApiErrorBoundary Integration Tests", () => {
  // console.error를 mock하여 테스트 출력을 깔끔하게 유지
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("정상 동작", () => {
    it("에러가 없을 때 자식 컴포넌트가 정상적으로 렌더링되어야 함", () => {
      renderWithQueryClient(
        <ApiErrorBoundary>
          <NormalComponent />
        </ApiErrorBoundary>,
      );

      expect(screen.getByText("정상적인 컴포넌트")).toBeInTheDocument();
    });
  });

  describe("Ky HTTPError 처리", () => {
    it("404 ky 에러를 적절히 처리해야 함", async () => {
      renderWithQueryClient(
        <ApiErrorBoundary>
          <KyErrorComponent status={404} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("요청하신 리소스를 찾을 수 없습니다."),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /이전 페이지로 돌아가기/i }),
        ).toBeInTheDocument();
      });
    });

    it("401 ky 에러를 적절히 처리해야 함", async () => {
      renderWithQueryClient(
        <ApiErrorBoundary>
          <KyErrorComponent status={401} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText("로그인이 필요합니다.")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /로그인 페이지로 이동/i }),
        ).toBeInTheDocument();
      });
    });

    it("500 ky 에러를 적절히 처리해야 함", async () => {
      renderWithQueryClient(
        <ApiErrorBoundary>
          <KyErrorComponent status={500} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("잠시 후 다시 시도해주세요."),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /다시 시도하기/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Axios 에러 처리", () => {
    it("404 axios 에러를 적절히 처리해야 함", async () => {
      renderWithQueryClient(
        <ApiErrorBoundary>
          <AxiosErrorComponent status={404} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("요청하신 리소스를 찾을 수 없습니다."),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /이전 페이지로 돌아가기/i }),
        ).toBeInTheDocument();
      });
    });

    it("403 axios 에러를 적절히 처리해야 함", async () => {
      renderWithQueryClient(
        <ApiErrorBoundary>
          <AxiosErrorComponent status={403} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText("권한이 없습니다.")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /이전 페이지로 돌아가기/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("커스텀 설정", () => {
    it("커스텀 fallback 컴포넌트를 사용해야 함", async () => {
      const customConfig: TPartialErrorConfig = {
        404: {
          type: "custom",
          fallback: (
            <div data-testid="custom-fallback">커스텀 404 컴포넌트</div>
          ),
        },
      };

      renderWithQueryClient(
        <ApiErrorBoundary overrideConfig={customConfig}>
          <KyErrorComponent status={404} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
        expect(screen.getByText("커스텀 404 컴포넌트")).toBeInTheDocument();
      });
    });

    it("커스텀 fallback 함수를 사용해야 함", async () => {
      const customConfig: TPartialErrorConfig = {
        404: {
          type: "custom",
          fallback: (error, resetErrorBoundary) => (
            <div>
              <div data-testid="error-status">
                에러 상태: {error.response?.status}
              </div>
              <button
                type="button"
                onClick={resetErrorBoundary}
                data-testid="custom-reset"
              >
                다시 시도하기
              </button>
            </div>
          ),
        },
      };

      renderWithQueryClient(
        <ApiErrorBoundary overrideConfig={customConfig}>
          <KyErrorComponent status={404} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("error-status")).toBeInTheDocument();
        expect(screen.getByText("에러 상태: 404")).toBeInTheDocument();
        expect(screen.getByTestId("custom-reset")).toBeInTheDocument();
      });
    });
  });

  describe("커스텀 컴포넌트", () => {
    it("커스텀 Button 컴포넌트를 사용해야 함", async () => {
      const CustomButton = (props: React.ComponentProps<"button">) => (
        <button
          type="button"
          {...props}
          data-testid="custom-button"
          className="custom-btn"
        >
          🔄 {props.children}
        </button>
      );

      renderWithQueryClient(
        <ApiErrorBoundary Button={CustomButton}>
          <KyErrorComponent status={404} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        const customButton = screen.getByTestId("custom-button");
        expect(customButton).toBeInTheDocument();
        expect(customButton).toHaveClass("custom-btn");
        expect(customButton).toHaveTextContent("🔄 이전 페이지로 돌아가기");
      });
    });
  });

  describe("에러 무시 기능", () => {
    it("지정된 상태 코드의 에러를 무시해야 함", () => {
      expect(() => {
        renderWithQueryClient(
          <ApiErrorBoundary ignoreError={[404]}>
            <KyErrorComponent status={404} />
          </ApiErrorBoundary>,
        );
      }).toThrow();
    });
  });

  describe("API 에러가 아닌 경우", () => {
    it("일반 에러는 catch하지 않아야 함", () => {
      expect(() => {
        renderWithQueryClient(
          <ApiErrorBoundary>
            <GenericErrorComponent />
          </ApiErrorBoundary>,
        );
      }).toThrow("Generic error");
    });
  });

  describe("onError 콜백", () => {
    it("에러 발생 시 onError 콜백이 호출되어야 함", async () => {
      const onErrorSpy = vi.fn();
      const customConfig: TPartialErrorConfig = {
        404: {
          type: "default",
          message: "오류가 발생했습니다.",
          onError: onErrorSpy,
        },
      };

      renderWithQueryClient(
        <ApiErrorBoundary overrideConfig={customConfig}>
          <KyErrorComponent status={404} />
        </ApiErrorBoundary>,
      );

      await waitFor(() => {
        expect(onErrorSpy).toHaveBeenCalledTimes(1);
        expect(onErrorSpy).toHaveBeenCalledWith(
          expect.any(MockHTTPError),
          expect.any(Object), // ErrorInfo
          404,
        );
      });
    });
  });
});
