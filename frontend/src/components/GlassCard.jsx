import React from 'react';

export const GlassCard = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#151E2E] border border-[#243047] rounded-2xl p-5 shadow-md text-slate-100 ${
        hover ? 'hover:border-indigo-500/50 hover:bg-[#182235] transition-all duration-200 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
