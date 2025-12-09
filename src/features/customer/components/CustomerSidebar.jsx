import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';
import { logout as apiLogout, getCustomerDeliveries } from '../../../utils/authApi';
import React, { useState, useEffect } from 'react';

const SidebarButton = ({ to, active, icon, label, count }) => {
  const router = useIonRouter();
  
  const handleClick = (e) => {
    e.preventDefault();
    if (document && document.activeElement) document.activeElement.blur();
    router.push(to, 'forward', 'push');
  };
  
  return (
    <button onClick={handleClick} className="w-full text-left">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full ${
          active ? 'bg-[#00B75A] text-white' : 'text-[#4B5563] hover:bg-gray-50'
        }`}
      >
        <img src={icon} alt={label} className="w-5 h-5" style={{ filter: active ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
        <YummyText className="flex-1 text-left text-[15px]">{label}</YummyText>
        {count !== undefined && (
          <span className="bg-[#FF6B00] text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[24px] text-center">
            {count}
          </span>
        )}
      </div>
    </button>
  );
};

const CustomerSidebar = () => {
  const router = useIonRouter();

  const handleLogout = () => {
    (async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token') || '';
        if (refreshToken) await apiLogout({ refreshToken });
      } catch (err) {
        console.error('Logout API failed', err);
      } finally {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        if (document && document.activeElement) document.activeElement.blur();
        router.push('/auth/customer/login', 'back', 'pop');
      }
    })();
  };

  const menuItems = [
    {
      id: 'dashboard',
      to: '/customer/dashboard',
      icon: '/dashboard-icon.svg',
      label: 'Dashboard',
    },
    {
      id: 'Track',
      to: '/customer/track',
      icon: '/locationicon.svg',
      label: 'Track ',
    },
    {
      id: 'deliveries',
      to: '/customer/deliveries',
      icon: '/blockicon.svg',
      label: 'My Deliveries'
    },
    {
      id: 'Book',
      to: '/customer/book',
      icon: '/bookicon.svg',
      label: 'Book',
    },
    {
      id: 'profile',
      to: '/customer/profile',
      icon: '/profileicon.svg',
      label: 'Profile',
    },
    {
      id: 'support',
      to: '/customer/support',
      icon: '/supporticon.svg',
      label: 'Support',
    },
  ];

  const location = useLocation();

  const [deliveriesCount, setDeliveriesCount] = useState(undefined);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        // Request first page with limit=1 and try to read total/pagination info
        const res = await getCustomerDeliveries({ page: 1, limit: 1 });
        // Response can be array or object
        const items = Array.isArray(res) ? res : (res?.data || res?.items || res?.results || []);
        const total = res?.total || res?.meta?.total || res?.data?.total || res?.pagination?.total || (Array.isArray(res) ? items.length : (res?.length || items.length));
        if (mounted) setDeliveriesCount(total || 0);
      } catch (err) {
        console.warn('Failed to fetch deliveries count', err);
      }
    };

    fetchCount();

    const onRefresh = () => fetchCount();
    const onCreated = (e) => {
      try {
        const delivery = e?.detail;
        // If we have a numeric count, increment; otherwise refetch
        if (typeof deliveriesCount === 'number') {
          setDeliveriesCount((c) => (c || 0) + 1);
        } else {
          fetchCount();
        }
      } catch (e) {
        fetchCount();
      }
    };

    const onUpdated = (e) => {
      try {
        const detail = e?.detail;
        // If status moved to delivered, decrement the active count
        if (detail && detail.previousStatus && detail.status) {
          const prev = (detail.previousStatus || '').toLowerCase();
          const curr = (detail.status || '').toLowerCase();
          if (prev !== 'delivered' && curr === 'delivered') {
            setDeliveriesCount((c) => Math.max((c || 1) - 1, 0));
            return;
          }
        }
        // fallback: refetch
        fetchCount();
      } catch (e) {
        fetchCount();
      }
    };

    window.addEventListener('deliveries:refresh', onRefresh);
    window.addEventListener('delivery:created', onCreated);
    window.addEventListener('delivery:updated', onUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('deliveries:refresh', onRefresh);
      window.removeEventListener('delivery:created', onCreated);
      window.removeEventListener('delivery:updated', onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-300 shadow-sm flex flex-col pt-20">
      {/* Menu Items */}
      <div className="px-3 py-4 space-y-1 flex-1">
        {menuItems.map((item) => (
          <SidebarButton
            key={item.id}
            to={item.to}
            active={location.pathname === item.to}
            icon={item.icon}
            label={item.label}
            count={item.count}
          />
        ))}
      </div>

      {/* Logout Button */}
      <div className="px-6 py-6 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-[#EF4444] hover:bg-red-50 transition-colors w-full px-3 py-2 rounded-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
          </svg>
          <YummyText className="text-[15px]">Logout</YummyText>
        </button>
      </div>
    </div>
  );
};

export default CustomerSidebar;
