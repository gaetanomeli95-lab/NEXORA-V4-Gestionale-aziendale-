import React from 'react';

export function NexoraLogo({ className = "w-8 h-8", showText = false, textClassName = "text-white font-bold text-lg tracking-tight" }: { className?: string, showText?: boolean, textClassName?: string }) {
  return (
    <div className="flex items-center">
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg overflow-hidden ${className}`}>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-white/20 blur-sm transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
        
        {/* Elegant 'N' letterform */}
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3/5 h-3/5 text-white">
          <path d="M5 19V5L19 19V5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {showText && (
        <span className={`ml-3 ${textClassName}`}>NEXORA</span>
      )}
    </div>
  );
}
