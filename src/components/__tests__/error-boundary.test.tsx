import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ErrorBoundary } from "../error-boundary";

// Mock 컴포넌트들
const NormalComponent = () => <div>정상적인 컴포넌트</div>;

const ErrorComponent = ({ message = "Test error" }: { message?: string }) => {
  throw new Error(message);
};

const NetworkErrorComponent = () => {
  const error = new Error("Network connection failed");
  error.name = "NetworkError";
  throw error;
};

const CustomErrorComponent = ({ code = 404 }: { code?: number }) => {
  const error = new Error(`Error ${code}`);
  error.name = code.toString();
  throw error;
};

// Custom Fallback Component
const CustomFallbackComponent = ({ error, resetErrorBoundary }: any) => (
  <div>
    <h2>Custom Error: {error.message}</h2>
    <button type="button" onClick={resetErrorBoundary}>
      Reset Error
    </button>
  </div>
);

describe("ErrorBoundary", () => {
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
      render(
        <ErrorBoundary
          fallbackRender={({ error }) => <div>Error: {error.message}</div>}
        >
          <NormalComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("정상적인 컴포넌트")).toBeInTheDocument();
    });
  });

  describe("에러 처리", () => {
    it("기본 에러를 처리하고 fallbackRender를 사용해야 함", async () => {
      render(
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>에러 발생: {error.message}</p>
              <button type="button" onClick={resetErrorBoundary}>
                다시 시도
              </button>
            </div>
          )}
        >
          <ErrorComponent message="Test error occurred" />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("에러 발생: Test error occurred"),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /다시 시도/i }),
        ).toBeInTheDocument();
      });
    });

    it("FallbackComponent를 사용해야 함", async () => {
      render(
        <ErrorBoundary FallbackComponent={CustomFallbackComponent}>
          <ErrorComponent message="Custom component error" />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Custom Error: Custom component error"),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Reset Error/i }),
        ).toBeInTheDocument();
      });
    });

    it("fallback ReactNode를 사용해야 함", async () => {
      render(
        <ErrorBoundary fallback={<div>Simple fallback</div>}>
          <ErrorComponent />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText("Simple fallback")).toBeInTheDocument();
      });
    });

    it("onError 콜백이 호출되어야 함", async () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary
          onError={onError}
          fallbackRender={({ error }) => <div>Error: {error.message}</div>}
        >
          <ErrorComponent message="Callback test error" />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Callback test error",
          }),
          expect.any(Object),
        );
      });
    });
  });

  describe("ignoreError 기능", () => {
    it("문자열 패턴으로 에러를 무시해야 함", () => {
      expect(() => {
        render(
          <ErrorBoundary
            ignoreError={["Network connection"]}
            fallbackRender={({ error }) => <div>Error: {error.message}</div>}
          >
            <NetworkErrorComponent />
          </ErrorBoundary>,
        );
      }).toThrow("Network connection failed");
    });

    it("숫자 패턴으로 에러를 무시해야 함", () => {
      expect(() => {
        render(
          <ErrorBoundary
            ignoreError={[404]}
            fallbackRender={({ error }) => <div>Error: {error.message}</div>}
          >
            <CustomErrorComponent code={404} />
          </ErrorBoundary>,
        );
      }).toThrow("Error 404");
    });

    it("함수 패턴으로 에러를 무시해야 함", () => {
      const ignoreFunction = vi.fn().mockReturnValue(true);

      expect(() => {
        render(
          <ErrorBoundary
            ignoreError={[ignoreFunction]}
            fallbackRender={({ error }) => <div>Error: {error.message}</div>}
          >
            <ErrorComponent message="Function test error" />
          </ErrorBoundary>,
        );
      }).toThrow("Function test error");
    });

    it("무시하지 않는 에러는 정상적으로 처리해야 함", async () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary
          ignoreError={["Network connection"]}
          onError={onError}
          fallbackRender={({ error }) => <div>Error: {error.message}</div>}
        >
          <ErrorComponent message="Different error" />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(screen.getByText("Error: Different error")).toBeInTheDocument();
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Different error",
          }),
          expect.any(Object),
        );
      });
    });

    it("여러 무시 조건을 함께 사용할 수 있어야 함", () => {
      expect(() => {
        render(
          <ErrorBoundary
            ignoreError={[
              "Network connection",
              404,
              (error) => error.message.includes("timeout"),
            ]}
            fallbackRender={({ error }) => <div>Error: {error.message}</div>}
          >
            <ErrorComponent message="Request timeout occurred" />
          </ErrorBoundary>,
        );
      }).toThrow("Request timeout occurred");
    });
  });

  describe("에러 경계 리셋", () => {
    it("resetErrorBoundary 호출 시 에러 상태가 초기화되어야 함", async () => {
      const user = userEvent.setup();
      let hasError = true;

      const ConditionalErrorComponent = () => {
        if (hasError) {
          throw new Error("Conditional error");
        }
        return <div>No error now</div>;
      };

      render(
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>Error: {error.message}</p>
              <button
                type="button"
                onClick={() => {
                  hasError = false;
                  resetErrorBoundary();
                }}
              >
                Reset
              </button>
            </div>
          )}
        >
          <ConditionalErrorComponent />
        </ErrorBoundary>,
      );

      // 에러 상태 확인
      await waitFor(() => {
        expect(
          screen.getByText("Error: Conditional error"),
        ).toBeInTheDocument();
      });

      // 리셋 버튼 클릭
      await user.click(screen.getByRole("button", { name: /Reset/i }));

      // 에러가 해결되어 정상 컴포넌트가 렌더링되어야 함
      await waitFor(() => {
        expect(screen.getByText("No error now")).toBeInTheDocument();
      });
    });

    it("resetKeys 변경 시 에러 상태가 초기화되어야 함", async () => {
      let hasError = true;
      const ConditionalErrorComponent = () => {
        if (hasError) {
          throw new Error("Reset keys test error");
        }
        return <div>Reset successful</div>;
      };

      const { rerender } = render(
        <ErrorBoundary
          resetKeys={["key1"]}
          fallbackRender={({ error }) => <div>Error: {error.message}</div>}
        >
          <ConditionalErrorComponent />
        </ErrorBoundary>,
      );

      // 에러 상태 확인
      await waitFor(() => {
        expect(
          screen.getByText("Error: Reset keys test error"),
        ).toBeInTheDocument();
      });

      // 에러 조건 해제 후 resetKeys 변경
      hasError = false;
      rerender(
        <ErrorBoundary
          resetKeys={["key2"]}
          fallbackRender={({ error }) => <div>Error: {error.message}</div>}
        >
          <ConditionalErrorComponent />
        </ErrorBoundary>,
      );

      // 에러가 해결되어 정상 컴포넌트가 렌더링되어야 함
      await waitFor(() => {
        expect(screen.getByText("Reset successful")).toBeInTheDocument();
      });
    });

    it("onReset 콜백이 호출되어야 함", async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();

      render(
        <ErrorBoundary
          onReset={onReset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>Error: {error.message}</p>
              <button type="button" onClick={resetErrorBoundary}>
                Reset
              </button>
            </div>
          )}
        >
          <ErrorComponent message="Reset callback test" />
        </ErrorBoundary>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Error: Reset callback test"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Reset/i }));

      await waitFor(() => {
        expect(onReset).toHaveBeenCalled();
      });
    });
  });
});
