
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'gold';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-sans font-bold py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-slate-700 text-white hover:bg-slate-600 border border-slate-500 hover:border-slate-400 shadow-lg shadow-slate-900/20",
    secondary: "bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500",
    danger: "bg-gradient-to-b from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 border border-red-800 shadow-lg shadow-red-900/20",
    success: "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600 border border-emerald-600 shadow-lg shadow-emerald-900/20",
    gold: "bg-gradient-to-b from-gold-400 to-gold-600 text-slate-900 hover:from-gold-300 hover:to-gold-500 border border-gold-300 shadow-lg shadow-gold-500/20",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
