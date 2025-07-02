# @dhlab-org/error-boundary

A universal React error boundary library that works with any router framework including Next.js, React Router, Tanstack Router, and more.

## Features

- 🔧 **Router Agnostic**: Works with any router library (Next.js, React Router, Tanstack Router, etc.)
- 🎯 **HTTP Error Handling**: Specialized handling for API errors with customizable actions
- 🔄 **Flexible Actions**: Uses native browser History API for maximum compatibility
- 📱 **SSR Safe**: Works in both client and server environments
- 🎨 **Customizable UI**: Bring your own components or use the built-in defaults
- 🚀 **Zero Dependencies**: Only peer dependencies for React ecosystem
- ⚡ **Fast & Modern**: Built with Biome for lightning-fast linting and formatting

## Installation

```bash
npm install @dhlab-org/error-boundary
# or
yarn add @dhlab-org/error-boundary
# or
pnpm add @dhlab-org/error-boundary
```

### Peer Dependencies

```bash
npm install react react-dom @tanstack/react-query react-error-boundary ky ts-pattern
```

## Quick Start

### 1. Wrap your app with GlobalErrorBoundary

```tsx
import { GlobalErrorBoundary } from '@dhlab-org/error-boundary';

function App() {
  return (
    <GlobalErrorBoundary>
      {/* Your app content */}
    </GlobalErrorBoundary>
  );
}
```

### 2. Use ApiErrorBoundary for API errors

```tsx
import { ApiErrorBoundary } from '@dhlab-org/error-boundary';

function MyPage() {
  return (
    <ApiErrorBoundary>
      <ComponentThatMakesAPIRequests />
    </ApiErrorBoundary>
  );
}
```

## Router Examples

### Next.js (App Router)

```tsx
// app/layout.tsx
import { GlobalErrorBoundary } from '@dhlab-org/error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GlobalErrorBoundary>
          {children}
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}

// Any page component
import { ApiErrorBoundary } from '@dhlab-org/error-boundary';

export default function Page() {
  return (
    <ApiErrorBoundary>
      <MyAPIComponent />
    </ApiErrorBoundary>
  );
}
```

### Next.js (Pages Router)

```tsx
// pages/_app.tsx
import { GlobalErrorBoundary } from '@dhlab-org/error-boundary';

export default function MyApp({ Component, pageProps }) {
  return (
    <GlobalErrorBoundary>
      <Component {...pageProps} />
    </GlobalErrorBoundary>
  );
}
```

### React Router

```tsx
import { BrowserRouter } from 'react-router-dom';
import { GlobalErrorBoundary } from '@dhlab-org/error-boundary';

function App() {
  return (
    <BrowserRouter>
      <GlobalErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </GlobalErrorBoundary>
    </BrowserRouter>
  );
}
```

### Tanstack Router

```tsx
import { RouterProvider } from '@tanstack/react-router';
import { GlobalErrorBoundary } from '@dhlab-org/error-boundary';

function App() {
  return (
    <GlobalErrorBoundary>
      <RouterProvider router={router} />
    </GlobalErrorBoundary>
  );
}
```

## Customization

### Custom Button Component

```tsx
import { ApiErrorBoundary } from '@dhlab-org/error-boundary';

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

### Custom Error Messages

```tsx
import { ApiErrorBoundary, type PartialErrorConfig } from '@dhlab-org/error-boundary';

const customConfig: PartialErrorConfig = {
  404: {
    type: 'default',
    message: 'Page not found! 😅',
    action: {
      type: 'go-root',
      message: 'Go Home',
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

### Custom Fallback Container

```tsx
import { ApiErrorBoundary } from '@dhlab-org/error-boundary';

const ErrorContainer = ({ children }) => (
  <div className="error-container">
    <header>My App - Error</header>
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

## API Reference

### ApiErrorBoundary

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Components to wrap with error boundary |
| `FallbackContainer` | `ComponentType` | `div` | Container component for error UI |
| `Button` | `ComponentType` | Built-in button | Custom button component |
| `overrideConfig` | `PartialErrorConfig` | - | Override default error messages/actions |
| `resetKeys` | `unknown[]` | `[pathname]` | Keys that trigger error boundary reset |
| `ignoreError` | `Array` | `[]` | Error types to ignore |
| `className` | `string` | `''` | CSS class for error container |

### GlobalErrorBoundary

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Components to wrap with error boundary |
| `fallback` | `ComponentType` | Built-in fallback | Custom error fallback component |

### Error Actions

The library includes these built-in actions:

- `go-back`: Navigate to previous page using `window.history.back()`
- `go-login`: Navigate to `/login` using `window.history.replaceState()`
- `go-root`: Navigate to `/` using `window.history.replaceState()`
- `retry`: Reset the error boundary to retry the failed operation

## Why Native History API?

This library uses the native browser History API (`window.history.pushState` and `window.history.replaceState`) instead of router-specific navigation methods. This approach:

- ✅ Works with any router library
- ✅ Integrates seamlessly with Next.js (as officially documented)
- ✅ Requires zero configuration
- ✅ Maintains framework-agnostic compatibility

According to [Next.js documentation](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api), these native methods integrate perfectly with the Next.js Router.

## Development

This library uses [Biome](https://biomejs.dev/) for fast linting and formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check

# Build
npm run build
```

## TypeScript Support

This library is written in TypeScript and includes full type definitions. All props and configurations are properly typed for the best developer experience.

## Contributing

We welcome contributions! Please see our contributing guide for details.

## License

MIT © dhlab-fe 