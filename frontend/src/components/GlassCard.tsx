import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  glow = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] shadow-2xl rounded-2xl transition-all duration-300 ${
        onClick ? 'hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-0.5 cursor-pointer' : ''
      } ${glow ? 'glow-active' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
