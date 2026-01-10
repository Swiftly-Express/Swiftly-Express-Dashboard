import React from 'react';

const VisaIcon = ({ className = '', alt = 'Visa', ...props }) => {
  return <img src="/visacard.svg" alt={alt} className={className} {...props} />;
};

export default VisaIcon;
