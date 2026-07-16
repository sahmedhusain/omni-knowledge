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
      className={`glass-panel ${onClick ? 'glass-panel-hover cursor-pointer' : ''} ${
        glow ? 'glow-active' : ''
      } ${className}`}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
