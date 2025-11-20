import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  inputLevel: number; // 0-255 roughly
  outputLevel: number; // 0-255 roughly
  isConnected: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ inputLevel, outputLevel, isConnected }) => {
  // Normalize levels to 0-1
  const userVol = Math.min(inputLevel / 50, 1); // Sensitivity tuning
  const aiVol = Math.min(outputLevel / 50, 1);
  
  const bars = 5;

  return (
    <div className="relative flex items-center justify-center h-32 w-full max-w-xs mx-auto bg-slate-100 rounded-2xl shadow-inner overflow-hidden transition-colors duration-500 border border-slate-200">
      {!isConnected && <span className="text-slate-400 text-sm font-medium">Ready to Start</span>}
      
      {isConnected && (
        <div className="flex items-center justify-center gap-8 w-full px-8">
           {/* User Indicator (Left) */}
           <div className="flex flex-col items-center gap-2">
             <div className="flex gap-1 h-16 items-center">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={`u-${i}`}
                    className="w-2 bg-blue-500 rounded-full transition-all duration-75 ease-out"
                    style={{ 
                      height: `${20 + userVol * 80 * (Math.random() * 0.5 + 0.5)}%`,
                      opacity: 0.5 + userVol * 0.5
                    }}
                  />
                ))}
             </div>
             <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">You</span>
           </div>

           {/* Divider */}
           <div className="h-12 w-[1px] bg-slate-300"></div>

           {/* AI Indicator (Right) */}
           <div className="flex flex-col items-center gap-2">
             <div className="flex gap-1 h-16 items-center">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={`a-${i}`}
                    className="w-2 bg-emerald-500 rounded-full transition-all duration-75 ease-out"
                    style={{ 
                      height: `${20 + aiVol * 80 * (Math.random() * 0.5 + 0.5)}%`,
                      opacity: 0.5 + aiVol * 0.5
                    }}
                  />
                ))}
             </div>
             <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Tutor</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;