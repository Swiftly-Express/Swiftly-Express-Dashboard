import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { YummyText } from './YummyText';

const Navbar = ({ className = '' }) => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  return (
    <nav className={`flex gap-10 items-center justify-between px-6 py-2 bg-white ${className}`}>
      <YummyText>
        <Link 
          to="/home" 
          className={`${isActive('/home') ? 'text-[#10b981]' : 'text-gray-700'} font-sm text-sm hover:text-[#059669] transition-colors`}
        >
          Home
        </Link>
      </YummyText>
      <YummyText>
        <Link 
          to="/services" 
          className={`${isActive('/services') ? 'text-[#10b981]' : 'text-gray-700'} font-sm text-sm hover:text-[#059669] transition-colors`}
        >
          Services
        </Link>
      </YummyText>
      <YummyText>
        <Link 
          to="/how-it-works" 
          className={`${isActive('/how-it-works') ? 'text-[#10b981]' : 'text-gray-700'} font-sm text-sm hover:text-[#059669] transition-colors`}
        >
          How It Works
        </Link>
      </YummyText>
      <YummyText>
        <Link 
          to="/smart-ride" 
          className={`${isActive('/smart-ride') ? 'text-[#10b981]' : 'text-gray-700'} font-sm text-sm hover:text-[#059669] transition-colors`}
        >
          Smart Ride
        </Link>
      </YummyText>
      <YummyText>
        <Link 
          to="/contact" 
          className={`${isActive('/contact') ? 'text-[#10b981]' : 'text-gray-700'} font-sm text-sm hover:text-[#059669] transition-colors`}
        >
          Contact
        </Link>
      </YummyText>
    </nav>
  );
};

export default Navbar;
