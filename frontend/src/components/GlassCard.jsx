import React from 'react';

export const GlassCard = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs ${
        hover ? 'hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
