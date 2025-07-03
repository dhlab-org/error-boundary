# @dhlab/error-boundary

일반적인 에러 바운더리부터 API 에러 전용 처리까지, 모든 에러 처리 요구사항을 하나의 패키지로 해결할 수 있습니다.

## 특징

- 🔧 **라우터 독립적**: 모든 라우터 라이브러리와 호환 (Next.js, React Router, Tanstack Router 등)
- 🚀 **완전한 에러 바운더리 솔루션**: 일반 ErrorBoundary + API 특화 ErrorBoundary 모두 제공
- ⚡ **ignoreError 기능**: 특정 에러를 무시하고 상위로 전파 (문자열, 숫자, 함수 패턴 지원)
- 🎯 **HTTP 에러 처리**: API 에러 전용 처리 및 사용자 정의 액션 지원
- 🌐 **다중 HTTP 클라이언트**: ky와 axios 모두 지원
- 🔄 **유연한 액션**: 최대 호환성을 위한 네이티브 브라우저 History API 사용
- 📦 **의존성 통합**: react-error-boundary 기능을 BaseErrorBoundary로 재내보내기
- 📱 **SSR 안전**: 클라이언트와 서버 환경 모두에서 동작
- 🎨 **커스터마이징 가능**: 자체 컴포넌트 사용 또는 내장 기본값 사용

## 설치

```bash
npm install @dhlab/error-boundary
# 또는
yarn add @dhlab/error-boundary
# 또는
pnpm add @dhlab/error-boundary
```

### Peer Dependencies

```bash
npm install react react-dom @tanstack/react-query

# HTTP 클라이언트 중 하나 이상 설치 (ApiErrorBoundary 사용 시)
npm install ky          # ky 사용 시
npm install axios       # axios 사용 시
```

> 📦 **참고**: `react-error-boundary`는 더 이상 별도로 설치할 필요가 없습니다. 모든 기능이 `BaseErrorBoundary`로 재내보내집니다.

## 패키지 구조

이 라이브러리는 계층적 구조로 설계되어 다양한 사용 사례를 지원합니다:

```
BaseErrorBoundary (react-error-boundary 재내보내기)
    ↓
ErrorBoundary (일반 에러 바운더리 + ignoreError 기능)
    ↓  
ApiErrorBoundary (API 에러 특화 처리)
```

### 어떤 컴포넌트를 사용해야 할까요?

- **ErrorBoundary**: 일반적인 JavaScript 에러 처리 + ignoreError 기능이 필요한 경우
- **ApiErrorBoundary**: HTTP API 에러를 특별히 처리하고 싶은 경우 (상태 코드별 메시지, 액션 등)
- **BaseErrorBoundary**: 기존 `react-error-boundary` 사용자가 마이그레이션 없이 사용하는 경우

## 빠른 시작

### 1. 일반 ErrorBoundary 사용법

```tsx
import { ErrorBoundary } from '@dhlab/error-boundary';

function MyApp() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          <h2>오류가 발생했습니다</h2>
          <p>{error.message}</p>
          <button onClick={resetErrorBoundary}>다시 시도</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### ignoreError 기능

특정 에러를 무시하고 상위로 전파시킬 수 있습니다:

```tsx
import { ErrorBoundary } from '@dhlab/error-boundary';

function MyApp() {
  return (
    <ErrorBoundary
      ignoreError={[
        'ChunkLoadError',           // 문자열 패턴으로 무시
        404,                        // 숫자 패턴으로 무시
        (error) => error.name === 'NetworkError'  // 함수로 조건부 무시
      ]}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>에러: {error.message}</div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 2. BaseErrorBoundary 사용법

기존 `react-error-boundary`와 동일한 API를 제공합니다:

```tsx
import { BaseErrorBoundary } from '@dhlab/error-boundary';

function MyApp() {
  return (
    <BaseErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => console.log(error)}
    >
      <MyComponent />
    </BaseErrorBoundary>
  );
}
```

### 3. ApiErrorBoundary 사용법

API 에러 전용 처리:

```tsx
import { ApiErrorBoundary } from '@dhlab/error-boundary';

function MyPage() {
  return (
    <ApiErrorBoundary>
      <ComponentThatMakesAPIRequests />
    </ApiErrorBoundary>
  );
}
```

### 2. 라우터별 사용 예제

#### Next.js (App Router)

```tsx
// app/layout.tsx
import { ApiErrorBoundary } from '@dhlab/error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ApiErrorBoundary>
          {children}
        </ApiErrorBoundary>
      </body>
    </html>
  );
}

// 페이지 컴포넌트
import { ApiErrorBoundary } from '@dhlab/error-boundary';

export default function Page() {
  return (
    <ApiErrorBoundary>
      <MyAPIComponent />
    </ApiErrorBoundary>
  );
}
```

## 커스터마이징

### 사용자 정의 버튼 컴포넌트

```tsx
import { ApiErrorBoundary } from '@dhlab/error-boundary';

const MyButton = ({ onClick, children, className }) => (
  <button 
    onClick={onClick} 
    className={`my-custom-button ${className}`}
  >
    {children}
  </button>
);

function MyPage() {
  return (
    <ApiErrorBoundary Button={MyButton}>
      <MyComponent />
    </ApiErrorBoundary>
  );
}
```

### 사용자 정의 에러 메시지

```tsx
import { ApiErrorBoundary, type PartialErrorConfig } from '@dhlab/error-boundary';

const customConfig: PartialErrorConfig = {
  404: {
    type: 'default',
    name: '페이지를 찾을 수 없음',
    message: '요청하신 페이지를 찾을 수 없습니다! 😅',
    action: {
      type: 'go-root',
      message: '홈으로 이동',
    },
  },
  401: {
    type: 'custom',
    fallback: <MyCustomLoginPrompt />,
  },
};

function MyPage() {
  return (
    <ApiErrorBoundary overrideConfig={customConfig}>
      <MyComponent />
    </ApiErrorBoundary>
  );
}
```

### 동적 에러 UI (fallback 함수)

```tsx
import { ApiErrorBoundary } from '@dhlab/error-boundary';

const customConfig = {
  500: {
    type: 'custom',
    fallback: (error, resetErrorBoundary) => (
      <div className="error-container">
        <h2>서버 오류가 발생했습니다</h2>
        <p>에러 코드: {error.response?.status}</p>
        <button onClick={resetErrorBoundary}>다시 시도</button>
      </div>
    ),
  },
};

function MyPage() {
  return (
    <ApiErrorBoundary overrideConfig={customConfig}>
      <MyComponent />
    </ApiErrorBoundary>
  );
}
```

### 사용자 정의 컨테이너

```tsx
import { ApiErrorBoundary } from '@dhlab/error-boundary';

const ErrorContainer = ({ children }) => (
  <div className="error-container">
    <header>내 앱 - 에러</header>
    {children}
  </div>
);

function MyPage() {
  return (
    <ApiErrorBoundary FallbackContainer={ErrorContainer}>
      <MyComponent />
    </ApiErrorBoundary>
  );
}
```

## API 참조

### ErrorBoundary

일반적인 에러 바운더리 컴포넌트입니다. `react-error-boundary`의 모든 기능 + `ignoreError` 기능을 제공합니다.

| Prop | 타입 | 기본값 | 설명 |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | 에러 바운더리로 감쌀 컴포넌트들 |
| `fallback` | `ReactNode` | - | 에러 발생 시 보여줄 정적 컴포넌트 |
| `FallbackComponent` | `ComponentType<FallbackProps>` | - | 에러 발생 시 사용할 컴포넌트 |
| `fallbackRender` | `(props: FallbackProps) => ReactNode` | - | 에러 발생 시 실행할 렌더 함수 |
| `onError` | `(error: Error, errorInfo: ErrorInfo) => void` | - | 에러 발생 시 실행할 콜백 |
| `onReset` | `() => void` | - | 에러 바운더리 리셋 시 실행할 콜백 |
| `resetKeys` | `Array<string\|number\|boolean\|null\|undefined>` | - | 에러 바운더리 리셋을 트리거하는 키들 |
| `resetOnPropsChange` | `boolean` | `false` | props 변경 시 자동 리셋 여부 |
| `ignoreError` | `Array<string\|number\|((error: Error) => boolean)>` | `[]` | 무시할 에러 패턴들 |

### BaseErrorBoundary

`react-error-boundary`의 `ErrorBoundary`와 동일한 API를 제공합니다. 기존 `react-error-boundary` 사용자를 위한 호환성 레이어입니다.

```tsx
import { BaseErrorBoundary } from '@dhlab/error-boundary';
// react-error-boundary의 ErrorBoundary와 동일하게 사용 가능
```

### ApiErrorBoundary

API 에러 전용 에러 바운더리 컴포넌트입니다.

| Prop | 타입 | 기본값 | 설명 |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | 에러 바운더리로 감쌀 컴포넌트들 |
| `FallbackContainer` | `ComponentType` | `div` | 에러 UI를 위한 컨테이너 컴포넌트 |
| `Button` | `ComponentType` | 내장 버튼 | 사용자 정의 버튼 컴포넌트 |
| `overrideConfig` | `PartialErrorConfig` | - | 기본 에러 메시지/액션 덮어쓰기 |
| `resetKeys` | `unknown[]` | `[pathname]` | 에러 바운더리 리셋을 트리거하는 키들 |
| `ignoreError` | `Array` | `[]` | 무시할 에러 타입들 |

### 에러 액션

라이브러리에 포함된 내장 액션들:

- `go-back`: `window.history.back()`을 사용해 이전 페이지로 이동
- `go-login`: `window.history.replaceState()`를 사용해 `/login`으로 이동
- `go-root`: `window.history.replaceState()`를 사용해 `/`로 이동
- `retry`: 에러 바운더리를 리셋하여 실패한 작업 재시도

### 에러 무시 기능

특정 에러를 무시하고 상위로 전파시키려면:

```tsx
import { ApiErrorBoundary } from '@dhlab/error-boundary';

function MyPage() {
  return (
    <ApiErrorBoundary 
      ignoreError={[
        404,                    // 404 상태 코드 무시
        'Not Found',            // 상태 텍스트 무시
        (error) => error.response?.status === 403  // 조건부 무시
      ]}
    >
      <MyComponent />
    </ApiErrorBoundary>
  );
}
```


## 네이티브 History API를 사용하는 이유

이 라이브러리는 라우터별 네비게이션 메서드 대신 네이티브 브라우저 History API(`window.history.pushState`와 `window.history.replaceState`)를 사용합니다. 이 접근 방식은:

- ✅ 모든 라우터 라이브러리와 호환
- ✅ Next.js와 완벽 통합 (공식 문서에 따름)
- ✅ 설정이 불필요
- ✅ 프레임워크 독립적 호환성 유지

[Next.js 공식 문서](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api)에 따르면, 이러한 네이티브 메서드들은 Next.js 라우터와 완벽하게 통합됩니다.

## 개발

이 라이브러리는 빠른 린팅과 포맷팅을 위해 [Biome](https://biomejs.dev/)을 사용합니다:

```bash
# 코드 린팅
npm run lint

# 린팅 문제 수정
npm run lint:fix

# 코드 포맷팅
npm run format

# 타입 체크
npm run type-check

# 빌드
npm run build

# 테스트
npm run test

# 테스트 (watch 모드)
npm run test:watch

# 테스트 커버리지
npm run test:coverage
```

## TypeScript 지원

이 라이브러리는 TypeScript로 작성되었으며 완전한 타입 정의를 포함합니다. 모든 props와 설정이 적절히 타입이 지정되어 최고의 개발자 경험을 제공합니다.

## 기여하기

기여를 환영합니다! 자세한 내용은 기여 가이드를 참조해주세요.

## 라이선스

MIT © dhlab-fe 