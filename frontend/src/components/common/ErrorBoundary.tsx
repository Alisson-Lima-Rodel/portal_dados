"use client";

import { Component, type ReactNode } from "react";
import { WidgetErrorCard } from "@/components/widgets/WidgetErrorCard";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMsg: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorCard
          message={this.props.fallbackMessage || this.state.errorMsg || "Erro inesperado"}
          onRetry={() => this.setState({ hasError: false, errorMsg: "" })}
        />
      );
    }
    return this.props.children;
  }
}
