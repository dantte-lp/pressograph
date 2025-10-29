// ═══════════════════════════════════════════════════════════════════
// Error Boundary Component
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
import { useLanguage } from "../../i18n";
import { useThemeStore } from "../../store/useThemeStore";
import { useShallow } from "zustand/react/shallow";

// Error Boundary Props
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

// Error Boundary State
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Default Error Fallback UI Component
interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetErrorBoundary: () => void;
  onGoBack: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  resetErrorBoundary,
  onGoBack,
}) => {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = React.useState(false);

  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="flex-col items-start gap-2 pb-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-shrink-0">
              <svg
                className="w-12 h-12 text-danger"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-danger">
                {t.errorBoundaryTitle}
              </h1>
              <p className="text-default-600 mt-1">
                {t.errorBoundaryDescription}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="gap-4">
          <div className="bg-danger/10 border-2 border-danger/20 rounded-lg p-4">
            <p className="font-mono text-sm text-danger-700 dark:text-danger-400 break-words">
              {error?.message || t.errorBoundaryUnknownError}
            </p>
          </div>

          {(isDevelopment || showDetails) && errorInfo && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm font-medium text-primary hover:underline mb-2"
                aria-label={showDetails ? "Hide error details" : "Show error details"}
              >
                {showDetails ? "▼ Hide Details" : "▶ Show Details"}
              </button>

              {showDetails && (
                <div className="bg-default-100 dark:bg-default-50/5 rounded-lg p-4 overflow-auto max-h-64 border border-divider">
                  <pre className="text-xs font-mono text-default-700 dark:text-default-400 whitespace-pre-wrap break-words">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 p-4 bg-default-100 dark:bg-default-50/5 rounded-lg border border-divider">
            <p className="text-sm text-default-600">
              {t.errorBoundaryHelpText}
            </p>
          </div>
        </CardBody>

        <CardFooter className="justify-end gap-2">
          <Button
            color="default"
            variant="flat"
            onPress={onGoBack}
            aria-label={t.errorBoundaryGoBack}
          >
            {t.errorBoundaryGoBack}
          </Button>

          <Button
            color="primary"
            variant="solid"
            onPress={resetErrorBoundary}
            aria-label={t.errorBoundaryReset}
          >
            {t.errorBoundaryReset}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      errorInfo,
    });
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.();

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryWithNavigation
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorBoundaryWithNavigation: React.FC<{
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetErrorBoundary: () => void;
}> = ({ error, errorInfo, resetErrorBoundary }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <DefaultErrorFallback
      error={error}
      errorInfo={errorInfo}
      resetErrorBoundary={resetErrorBoundary}
      onGoBack={handleGoBack}
    />
  );
};

export type { ErrorBoundaryProps, ErrorBoundaryState };
