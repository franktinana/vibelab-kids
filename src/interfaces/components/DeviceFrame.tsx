'use client';

import React, { ReactNode } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceFrameProps {
  device: DeviceType;
  children: ReactNode;
}

const deviceDimensions: Record<DeviceType, { width: string; height: string }> = {
  mobile: { width: 'w-96', height: 'h-full' },
  tablet: { width: 'w-full max-w-2xl', height: 'h-full' },
  desktop: { width: 'w-full', height: 'h-screen' },
};

const deviceFrameClasses: Record<DeviceType, string> = {
  mobile: 'rounded-3xl border-8 border-gray-900 shadow-2xl',
  tablet: 'rounded-lg border-4 border-gray-800 shadow-xl',
  desktop: 'rounded-t-lg border-t-4 border-l-4 border-r-4 border-gray-800',
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ device, children }) => {
  const dims = deviceDimensions[device];
  const frameClass = deviceFrameClasses[device];

  return (
    <div className={`flex items-center justify-center ${dims.width} ${dims.height}`}>
      <div className={`relative w-full bg-white overflow-hidden ${frameClass}`}>
        {/* Device Screen */}
        <div className="w-full h-full bg-white overflow-auto">
          {children}
        </div>

        {/* Mobile-specific notch */}
        {device === 'mobile' && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl" />
        )}

        {/* Tablet-specific status bar */}
        {device === 'tablet' && (
          <div className="absolute top-0 w-full h-8 bg-gray-100 border-b border-gray-200" />
        )}

        {/* Desktop-specific window chrome */}
        {device === 'desktop' && (
          <div className="absolute top-0 w-full h-10 bg-gray-200 border-b border-gray-300 flex items-center px-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 text-center text-xs text-gray-600">localhost:3000</div>
          </div>
        )}
      </div>
    </div>
  );
};
