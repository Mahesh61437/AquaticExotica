import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  href?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12',
  xl: 'h-20 w-20'
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
};

export function Logo({ 
  size = 'md', 
  showText = true, 
  className = '',
  href = '/home'
}: LogoProps) {
  const logoElement = (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img 
        src="https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/icon%2Faquaticexoticicon.png?alt=media&token=d7bcaa53-5145-4203-af8f-4ceed21b4657" 
        alt="Aquatic Exotica Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <span className={`${textSizeClasses[size]} font-heading font-bold text-primary`}>
          AquaticExotica
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
