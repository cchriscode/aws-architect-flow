"use client";

import React from "react";
import { useDict } from "@/lib/i18n/context";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallbackContent({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const t = useDict();
  return (
    <div className="p-6 text-center text-red-600">
      <p className="font-semibold">{t.errorBoundary.title}</p>
      <p className="text-sm mt-1 text-gray-500">
        {error?.message}
      </p>
      <button
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        onClick={onRetry}
      >
        {t.errorBoundary.tryAgain}
      </button>
    </div>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallbackContent
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
