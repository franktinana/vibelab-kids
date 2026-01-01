'use client';

import React, { useState, useRef } from 'react';

interface PasteZoneProps {
  onValidCode?: (code: string) => void;
}

export const PasteZone: React.FC<PasteZoneProps> = ({ onValidCode }) => {
  const [pastedCode, setPastedCode] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const validateCode = (code: string): boolean => {
    // Simple validation: check for 'function' or 'var/const' keywords
    const containsFunction = code.includes('function');
    const containsVarOrConst = /\b(var|const|let)\b/.test(code);
    return containsFunction || containsVarOrConst;
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData('text');
    setPastedCode(pasted);

    if (validateCode(pasted)) {
      setIsValid(true);
      triggerConfetti();
      onValidCode?.(pasted);
    } else {
      setIsValid(false);
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: ['#ff6b6b', '#4ecdc4', '#45b7d1'][Math.floor(Math.random() * 3)],
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-800">
            Paste Your Code Here
          </label>

          <textarea
            ref={textAreaRef}
            onPaste={handlePaste}
            value={pastedCode}
            onChange={(e) => setPastedCode(e.target.value)}
            placeholder="Paste your code (must contain function or var/const)"
            className={`w-full h-64 p-4 border-2 rounded-lg font-mono text-sm transition-colors ${
              isValid
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white'
            }`}
          />
        </div>

        {isValid && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-400 to-emerald-600 rounded-lg">
            <div className="flex items-center space-x-3">
              <span>🏆</span>
              <div>
                <h3 className="text-white font-bold">Badge Unlocked!</h3>
                <p className="text-green-100">Script Kiddie</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
