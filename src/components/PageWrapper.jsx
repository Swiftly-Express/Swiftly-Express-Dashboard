import React from 'react';

/**
 * PageWrapper - Centralized spacing and max-width component
 * 
 * Controls:
 * - Horizontal padding (edge spacing): px-4 md:px-6 lg:px-6
 * - Max width: Configurable via size prop
 * - Centers content with mx-auto
 * 
 * To adjust spacing for all pages, modify the values here:
 * - px-4: Mobile edge spacing (16px)
 * - md:px-6: Tablet edge spacing (24px)  
 * - lg:px-6: Desktop/MacBook edge spacing (24px)
 */

const PageWrapper = ({ 
  children, 
  className = '',
  size = 'default', // 'full' | 'wide' | 'default' | 'narrow' | 'custom'
  noPadding = false // Override padding if needed
}) => {
  const sizeClasses = {
    full: 'max-w-full',
    wide: 'max-w-7xl',
    default: 'max-w-6xl',
    narrow: 'max-w-4xl',
    custom: '' // Use className for custom max-width
  };

  const paddingClass = noPadding ? '' : 'px-4 md:px-6 lg:px-6';

  return (
    <div className={`${sizeClasses[size]} mx-auto w-full ${paddingClass} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default PageWrapper;
