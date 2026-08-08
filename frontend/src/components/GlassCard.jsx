import React from 'react';

export const GlassCard = ({ children, className = '', hover = false }) => {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm ${
      hover ? 'hover:shadow-md hover:border-indigo-200 transition-all duration-200' : ''
    } ${className}`}>
      {children}
    </div>
  );
};
