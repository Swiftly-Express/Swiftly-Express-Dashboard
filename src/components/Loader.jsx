import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
        {message && <p className="text-[#64748B]">{message}</p>}
      </div>
    </div>
  );
};

export default Loader;
