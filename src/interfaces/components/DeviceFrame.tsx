'use client';

import React, { ReactNode } from 'react';

type DeviceType = 'mobile' | '720p' | '1080p' | '1440p';

interface DeviceFrameProps {
  device: DeviceType;
  children: ReactNode;
}

// Actual screen dimensions in pixels with scale factors to fit on screen
const deviceDimensions: Record<DeviceType, { width: number; height: number; scale: number }> = {
  mobile: { width: 390, height: 844, scale: 0.7 },    // iPhone 14 size
  '720p': { width: 1280, height: 720, scale: 0.65 },  // HD 720p
  '1080p': { width: 1920, height: 1080, scale: 0.5 }, // Full HD 1080p
  '1440p': { width: 2560, height: 1440, scale: 0.38 }, // Quad HD 1440p
};

const deviceLabels: Record<DeviceType, string> = {
  mobile: '📱 Mobile (390×844)',
  '720p': '💻 720p (1280×720)',
  '1080p': '🖥️ 1080p (1920×1080)',
  '1440p': '🖥️ 1440p (2560×1440)',
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ device, children }) => {
  const { width, height, scale } = deviceDimensions[device];
  
  // Calculate scaled dimensions for container
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  if (device === 'mobile') {
    // Mobile phone frame with notch
    return (
      <div 
        className="relative bg-black rounded-[3rem] p-3 shadow-2xl"
        style={{ 
          width: `${scaledWidth + 24}px`,
          height: `${scaledHeight + 24}px`
        }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />
        {/* Screen container */}
        <div 
          className="relative bg-white rounded-[2.5rem] overflow-hidden"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`
          }}
        >
          {/* Actual content at full resolution, scaled down */}
          <div
            style={{
              width: `${width}px`,
              height: `${height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Laptop frame (browser window style)
  return (
    <div 
      className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
      style={{
        width: `${scaledWidth + 8}px`,
        height: `${scaledHeight + 36}px`
      }}
    >
      {/* Browser chrome */}
      <div className="h-8 bg-gray-700 flex items-center px-3 gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-gray-600 rounded h-5 mx-2 flex items-center justify-center">
          <span className="text-gray-400 text-xs">{deviceLabels[device]}</span>
        </div>
      </div>
      {/* Screen container */}
      <div 
        className="bg-white overflow-hidden"
        style={{
          width: `${scaledWidth + 8}px`,
          height: `${scaledHeight}px`,
          padding: '4px'
        }}
      >
        {/* Actual content at full resolution, scaled down */}
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export type { DeviceType };
