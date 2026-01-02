'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * GameErrorBoundary - Catches errors in the game rendering pipeline
 * Provides a fallback UI and reset functionality
 */
class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to console for debugging
    console.error('GameErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6 rounded-lg">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="text-6xl mb-4">💥</div>
            
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              Oops! Game Crashed
            </h2>
            
            <p className="text-gray-300 mb-4">
              Something went wrong while running your game. 
              Don&apos;t worry, your code is safe!
            </p>
            
            {/* Error Details (collapsed by default) */}
            {this.state.error && (
              <details className="text-left bg-gray-800 rounded p-3 mb-4">
                <summary className="cursor-pointer text-yellow-400 font-medium">
                  🔍 See Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-300 overflow-auto max-h-40">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            
            {/* Reset Button */}
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              🔄 Try Again
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Tip: Check your code for syntax errors or infinite loops
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;
