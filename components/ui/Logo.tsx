import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <img 
      src="https://i.imgur.com/3AdnfGw.png" 
      alt="Pump Casino" 
      className={`h-12 w-auto object-contain ${className}`} 
    />
  );
};