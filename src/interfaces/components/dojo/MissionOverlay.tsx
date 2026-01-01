'use client';

import React, { useState } from 'react';

interface MissionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  missionNumber?: number;
}

export const MissionOverlay: React.FC<MissionOverlayProps> = ({
  isOpen,
  onClose,
  missionNumber = 1,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-800"
        >
          ×
        </button>

        {/* Mission Card - TikTok Style */}
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          {/* Video Placeholder */}
          <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-900 shadow-md">
            {/* Loop video or show card - placeholder URL */}
            <video
              src="https://media.giphy.com/media/xT9IgEx8SbQ0teblWU/giphy.mp4"
              autoPlay
              loop
              muted
              className="h-full w-full object-cover"
            />
            {/* Fallback text if video doesn't load */}
            <div className="absolute inset-0 flex items-center justify-center text-center text-white">
              <p className="text-lg font-semibold">
                Mission {missionNumber} Loading...
              </p>
            </div>
          </div>

          {/* Mission Text */}
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Mission {missionNumber}: The Heist
            </h2>
            <p className="text-gray-700">
              Go to Gemini/ChatGPT, ask for a 'Red Ball' script, and bring it back!
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};
