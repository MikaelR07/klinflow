import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  isInteractive?: boolean;
}

export function Card({
  className = '',
  variant = 'default',
  padding = 'md',
  isInteractive = false,
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl lg:rounded-[2rem] overflow-hidden';
  
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
    glass: 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-slate-700/50',
    gradient: 'bg-gradient-to-br from-primary to-[#064e3b] dark:from-emerald-900 dark:to-primary text-white',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5 lg:p-6',
    lg: 'p-8 lg:p-10',
  };

  const interactiveStyles = isInteractive 
    ? 'transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer' 
    : '';

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 dark:text-white tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 font-medium ${className}`} {...props}>
      {children}
    </p>
  );
}
