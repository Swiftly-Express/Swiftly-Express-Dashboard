import React from 'react';

type Props = {
  children?: React.ReactNode;
  className?: string;
};

const PageWrapper: React.FC<Props> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-7xl mx-auto w-full px-6 ${className}`.trim()}>
      {children}
    </div>
  );
};

export default PageWrapper;
