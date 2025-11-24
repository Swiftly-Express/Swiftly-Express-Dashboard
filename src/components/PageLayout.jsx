import React from 'react';

/**
 * PageLayout - Centralized layout component for consistent spacing across all pages
 * 
 * This component handles:
 * - Responsive horizontal padding (edges spacing)
 * - Responsive vertical spacing between sections
 * - Maximum width constraints
 * - Consistent spacing across different screen sizes (mobile, tablet, MacBook, desktop)
 */

// Section wrapper with responsive vertical spacing
export const Section = ({ 
  children, 
  className = '', 
  spacing = 'normal', // 'none' | 'tight' | 'normal' | 'loose'
  background = 'transparent' 
}) => {
  const spacingClasses = {
    none: '',
    tight: 'py-4 md:py-6 lg:py-4',
    normal: 'py-8 md:py-12 lg:py-8',
    loose: 'py-12 md:py-16 lg:py-12'
  };

  return (
    <section className={`${spacingClasses[spacing]} ${background} ${className}`.trim()}>
      {children}
    </section>
  );
};

// Content container with max-width and horizontal padding
export const Container = ({ 
  children, 
  className = '', 
  size = 'default' // 'full' | 'wide' | 'default' | 'narrow'
}) => {
  const sizeClasses = {
    full: 'max-w-full',
    wide: 'max-w-7xl',
    default: 'max-w-6xl',
    narrow: 'max-w-4xl'
  };

  return (
    <div className={`${sizeClasses[size]} mx-auto w-full px-4 md:px-6 lg:px-6 ${className}`.trim()}>
      {children}
    </div>
  );
};

// Combined Section + Container for convenience
export const SectionContainer = ({ 
  children, 
  className = '',
  sectionClassName = '',
  containerClassName = '',
  spacing = 'normal',
  size = 'default',
  background = 'transparent'
}) => {
  return (
    <Section spacing={spacing} background={background} className={`${sectionClassName} ${className}`.trim()}>
      <Container size={size} className={containerClassName}>
        {children}
      </Container>
    </Section>
  );
};

// Grid layout with consistent spacing
export const Grid = ({ 
  children, 
  className = '',
  cols = { base: 1, md: 2, lg: 3 }, // responsive columns
  gap = 'normal' // 'tight' | 'normal' | 'loose'
}) => {
  const gapClasses = {
    tight: 'gap-4',
    normal: 'gap-6',
    loose: 'gap-8'
  };

  const colsClass = `grid-cols-${cols.base} md:grid-cols-${cols.md} lg:grid-cols-${cols.lg}`;

  return (
    <div className={`grid ${colsClass} ${gapClasses[gap]} ${className}`.trim()}>
      {children}
    </div>
  );
};

// Vertical spacing utility
export const Spacer = ({ 
  size = 'normal' // 'small' | 'normal' | 'large'
}) => {
  const sizeClasses = {
    small: 'h-4 md:h-6 lg:h-4',
    normal: 'h-8 md:h-12 lg:h-8',
    large: 'h-12 md:h-16 lg:h-12'
  };

  return <div className={sizeClasses[size]} />;
};

export default {
  Section,
  Container,
  SectionContainer,
  Grid,
  Spacer
};
