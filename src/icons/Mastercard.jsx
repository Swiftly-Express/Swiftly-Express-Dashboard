import React from 'react';

const MastercardIcon = ({ className = '', alt = 'Mastercard', ...props }) => {
  return <img src="/mastercard.svg" alt={alt} className={className} {...props} />;
};

export default MastercardIcon;
