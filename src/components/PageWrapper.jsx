import React from 'react';



const PageWrapper = ({ children, className = '' }) => {
  return (
    <div className={`max-w-7xl mx-auto w-full px-6 ${className}`.trim()}>
      {children}
    </div>
  );
};

export default PageWrapper;
