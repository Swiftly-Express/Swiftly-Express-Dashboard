import React from 'react';

const StoreButtons = ({ className = '' }) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play">
        <img src="/playstore.svg" alt="Get it on Google Play" className="h-11" />
      </a>
      <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer" aria-label="Download on the App Store">
        <img src="/applestore.svg" alt="Download on the App Store" className="h-11" />
      </a>
    </div>
  );
};

export default StoreButtons;
