'use client';
import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

// Message types for parent-iframe communication
export type GameMessage = 
  | { type: 'GAME_READY' }
  | { type: 'GAME_STATE'; state: string }
  | { type: 'GAME_ERROR'; error: string }
  | { type: 'GAME_LOG'; message: string }
  | { type: 'REQUEST_STATE' }
  | { type: 'LOAD_STATE'; state: string };

export interface GameState {
  code: string;
  savedState?: string;
  timestamp: number;
}

export interface SandboxedGameRunnerProps {
  code: string;
  sandbox?: string;
  className?: string;
  onError?: (error: string) => void;
  onLog?: (message: string) => void;
  onStateChange?: (state: string) => void;
}

export interface SandboxedGameRunnerRef {
  focus: () => void;
  reload: () => void;
  saveState: () => Promise<string | null>;
  loadState: (state: string) => void;
}

const DEFAULT_SANDBOX = 'allow-scripts allow-same-origin allow-pointer-lock';

// Inject message handling into the game code
const injectMessageHandler = (code: string): string => {
  const messageHandler = `
<script>
// VibeLab Game Runner - Message Handler
(function() {
  const vibelab = {
    state: null,
    
    // Save game state
    saveState: function(data) {
      this.state = JSON.stringify(data);
      window.parent.postMessage({ type: 'GAME_STATE', state: this.state }, '*');
    },
    
    // Get current state
    getState: function() {
      return this.state ? JSON.parse(this.state) : null;
    },
    
    // Log to parent console
    log: function(msg) {
      window.parent.postMessage({ type: 'GAME_LOG', message: String(msg) }, '*');
    },
    
    // Report error
    error: function(err) {
      window.parent.postMessage({ type: 'GAME_ERROR', error: String(err) }, '*');
    }
  };
  
  // Listen for messages from parent
  window.addEventListener('message', function(event) {
    if (event.data.type === 'REQUEST_STATE') {
      window.parent.postMessage({ type: 'GAME_STATE', state: vibelab.state }, '*');
    } else if (event.data.type === 'LOAD_STATE') {
      vibelab.state = event.data.state;
      if (window.onVibeLabStateLoaded) {
        window.onVibeLabStateLoaded(vibelab.getState());
      }
    }
  });
  
  // Notify parent that game is ready
  window.addEventListener('load', function() {
    window.parent.postMessage({ type: 'GAME_READY' }, '*');
  });
  
  // Global error handler
  window.onerror = function(msg, url, line, col, error) {
    vibelab.error(msg + ' at line ' + line);
    return false;
  };
  
  // Expose to game code
  window.vibelab = vibelab;
})();
</script>
`;
  
  // Insert before closing </head> or at start of <body>
  if (code.includes('</head>')) {
    return code.replace('</head>', messageHandler + '</head>');
  } else if (code.includes('<body>')) {
    return code.replace('<body>', '<body>' + messageHandler);
  } else {
    return messageHandler + code;
  }
};

export const SandboxedGameRunner = forwardRef<SandboxedGameRunnerRef, SandboxedGameRunnerProps>(
  ({ code, sandbox = DEFAULT_SANDBOX, className = '', onError, onLog, onStateChange }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Handle messages from iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent<GameMessage>) => {
        // Only handle messages from our iframe
        if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
          switch (event.data.type) {
            case 'GAME_READY':
              setIsReady(true);
              setHasError(false);
              setErrorMessage(null);
              break;
            case 'GAME_STATE':
              onStateChange?.(event.data.state);
              break;
            case 'GAME_ERROR':
              setHasError(true);
              setErrorMessage(event.data.error);
              onError?.(event.data.error);
              break;
            case 'GAME_LOG':
              onLog?.(event.data.message);
              break;
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onError, onLog, onStateChange]);
    
    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        iframeRef.current?.focus();
      },
      reload: () => {
        setIsReady(false);
        setHasError(false);
        setErrorMessage(null);
        if (iframeRef.current) {
          iframeRef.current.srcdoc = injectMessageHandler(code);
        }
      },
      saveState: () => {
        return new Promise((resolve) => {
          const handler = (event: MessageEvent<GameMessage>) => {
            if (event.data.type === 'GAME_STATE') {
              window.removeEventListener('message', handler);
              resolve(event.data.state);
            }
          };
          window.addEventListener('message', handler);
          iframeRef.current?.contentWindow?.postMessage({ type: 'REQUEST_STATE' }, '*');
          setTimeout(() => {
            window.removeEventListener('message', handler);
            resolve(null);
          }, 1000);
        });
      },
      loadState: (state: string) => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'LOAD_STATE', state }, '*');
      },
    }));
    
    // Prepare code with message handler
    const preparedCode = injectMessageHandler(code);
    
    return (
      <div className={`relative ${className}`}>
        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center z-10 p-4">
            <div className="bg-red-800 rounded-lg p-4 max-w-md text-center">
              <div className="text-red-200 text-lg font-bold mb-2">⚠️ Game Error</div>
              <div className="text-red-100 text-sm font-mono">{errorMessage}</div>
              <button
                onClick={() => {
                  setHasError(false);
                  setErrorMessage(null);
                }}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {!isReady && !hasError && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="text-white text-lg">Loading game...</div>
          </div>
        )}
        
        {/* Game iframe */}
        <iframe
          ref={iframeRef}
          srcDoc={preparedCode}
          sandbox={sandbox}
          className="w-full h-full border-0"
          title="Game Sandbox"
          tabIndex={0}
        />
      </div>
    );
  }
);

SandboxedGameRunner.displayName = 'SandboxedGameRunner';

export default SandboxedGameRunner;
