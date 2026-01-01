'use client';
import React, { ReactNode } from 'react';

export type DeviceType = 'mobile' | '720p' | '1080p' | '1440p';
export type Orientation = 'portrait' | 'landscape';

interface DeviceFrameProps {
  device: DeviceType;
  orientation?: Orientation;
  showTouchIndicator?: boolean;
  children: ReactNode;
}

// Device dimensions with orientation support
const getDeviceDimensions = (device: DeviceType, orientation: Orientation) => {
  const dimensions: Record<DeviceType, { width: number; height: number; scale: number }> = {
    mobile: { width: 390, height: 844, scale: 0.7 },
    '720p': { width: 1280, height: 720, scale: 0.65 },
    '1080p': { width: 1920, height: 1080, scale: 0.5 },
    '1440p': { width: 2560, height: 1440, scale: 0.38 },
  };
  
  const dim = dimensions[device];
  
  // Swap width/height for landscape on mobile
  if (device === 'mobile' && orientation === 'landscape') {
    return { width: dim.height, height: dim.width, scale: dim.scale };
  }
  
  return dim;
};

const deviceLabels: Record<DeviceType, string> = {
  mobile: '📱 Mobile',
  '720p': '💻 720p (1280×720)',
  '1080p': '🖥️ 1080p (1920×1080)',
  '1440p': '🖥️ 1440p (2560×1440)',
};

export function DeviceFrame({ 
  device, 
  orientation = 'portrait',
  showTouchIndicator = false,
  children 
}: DeviceFrameProps) {
  const { width, height, scale } = getDeviceDimensions(device, orientation);
  const isMobile = device === 'mobile';
  const isLandscape = orientation === 'landscape';

  // Mobile frame styling
  if (isMobile) {
    return (
      <div 
        className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl"
        style={{ 
          width: (isLandscape ? height : width) * scale + 24,
          height: (isLandscape ? width : height) * scale + 24,
        }}
      >
        {/* Notch - positioned based on orientation */}
        <div 
          className={`absolute bg-black rounded-full z-10 ${
            isLandscape 
              ? 'left-1/2 top-2 -translate-x-1/2 w-24 h-6' 
              : 'left-1/2 top-2 -translate-x-1/2 w-24 h-6'
          }`}
        />
        
        {/* Screen */}
        <div 
          className="bg-black rounded-[2.5rem] overflow-hidden relative"
          style={{ 
            width: width * scale,
            height: height * scale,
          }}
        >
          {/* Touch indicator overlay */}
          {showTouchIndicator && (
            <div className="absolute top-2 right-2 z-20 bg-yellow-500/80 text-black text-xs px-2 py-1 rounded-full font-medium">
              👆 Touch Mode
            </div>
          )}
          
          {/* Content scaled to fit */}
          <div 
            style={{ 
              width: width,
              height: height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
        
        {/* Home indicator */}
        <div className={`absolute bg-white/30 rounded-full ${
          isLandscape
            ? 'right-2 top-1/2 -translate-y-1/2 w-1 h-24'
            : 'bottom-2 left-1/2 -translate-x-1/2 w-24 h-1'
        }`} />
      </div>
    );
  }

  // Desktop/Laptop frame styling (720p, 1080p, 1440p)
  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl"
      style={{ 
        width: width * scale,
      }}
    >
      {/* Browser chrome */}
      <div className="bg-gray-700 px-4 py-2 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-gray-600 rounded px-3 py-1 text-gray-300 text-sm">
          {deviceLabels[device]}
        </div>
      </div>
      
      {/* Screen content */}
      <div 
        className="bg-black overflow-hidden"
        style={{ 
          width: width * scale,
          height: height * scale,
        }}
      >
        <div 
          style={{ 
            width: width,
            height: height,
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

export { DeviceFrame as default };
