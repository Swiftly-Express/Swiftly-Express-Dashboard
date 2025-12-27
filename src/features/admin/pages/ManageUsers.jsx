import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Search, Filter, MoreVertical, Mail, Phone, Plus, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import LocationIcon from '../../../icons/Locationicon';
import PeopleIcon from '../../../icons/Peopleicon';
import CheckCircleIcon from '../../../icons/Circlecheck';
import PauseIcon from '../../../icons/Pauseicon';
import BanIcon from '../../../icons/Banicon';
import { getAllUsers, deleteUser } from '../../../utils/adminApi';
import { formatAddress } from '../../../utils/formatters';

const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 20;

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0
  });

  // Fetch users from API
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      console.log(`Fetching users page ${page}...`);
      const response = await getAllUsers(page, limit);

      console.log('Users API response:', response);

      // Handle different response structures
      const usersData = response?.data?.users || response?.users || response?.data || [];
      const pagination = response?.data?.pagination || response?.pagination || {};

      setUsers(usersData);
      setTotalUsers(pagination.total || usersData.length);
      setTotalPages(pagination.totalPages || Math.ceil((pagination.total || usersData.length) / limit));
      setCurrentPage(pagination.currentPage || page);

      // Calculate stats from users data
      calculateStats(usersData);

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from users data
  const calculateStats = (usersData) => {
    const total = usersData.length;
    const active = usersData.filter(u => u.status === 'active' || u.isActive).length;
    const inactive = usersData.filter(u => u.status === 'inactive' || (!u.isActive && u.status !== 'suspended')).length;
    const suspended = usersData.filter(u => u.status === 'suspended' || u.isSuspended).length;

    setStats({ total, active, inactive, suspended });
  };

  // Delete user handler
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      // Refresh users list
      fetchUsers(currentPage);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.message || 'Failed to delete user');
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Stats cards data
  const statsCards = [
    {
      label: 'Total Users',
      value: totalUsers.toLocaleString(),
      icon: <PeopleIcon className="w-5 h-5" stroke="#1E1E1E" />,
      bgColor: '#F3F4F6',
      valueColor: '#1E1E1E'
    },
    {
      label: 'Active Users',
      value: stats.active.toLocaleString(),
      icon: <CheckCircleIcon size={18} color="#00A63E" />,
      bgColor: '#D1FAE5',
      valueColor: '#00A63E'
    },
    {
      label: 'Inactive Users',
      value: stats.inactive.toLocaleString(),
      icon: <PauseIcon className="w-5 h-5" stroke="#6B7280" />,
      bgColor: '#F3F4F6',
      valueColor: '#6B7280'
    },
    {
      label: 'Suspended',
      value: stats.suspended.toLocaleString(),
      icon: <BanIcon className="w-5 h-5" stroke="#EF4444" />,
      bgColor: '#FEE2E2',
      valueColor: '#EF4444'
    }
  ];

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      (user.fullName || user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.userId || user._id || user.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' ||
      (user.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Format user status
  const getUserStatus = (user) => {
    if (user.isSuspended || user.status === 'suspended') {
      return { status: 'Suspended', color: 'bg-red-100 text-red-800' };
    }
    if (user.isActive || user.status === 'active') {
      return { status: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'Inactive', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-no-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-medium text-[#1E1E1E] mb-2">Manage Users</YummyText>
            <YummyText className="text-[#717182]">View and manage all customer accounts</YummyText>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-start">
                  <div
                    className="p-2 rounded-lg mb-3"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    {stat.icon}
                  </div>
                  <YummyText className="text-sm text-gray-500 mb-1">{stat.label}</YummyText>
                  <YummyText className="text-3xl font-medium" style={{ color: stat.valueColor }}>{stat.value}</YummyText>
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => fetchUsers(currentPage)}
                className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Table Header */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <YummyText className="text-medium font-medium text-gray-900">All Users</YummyText>
                  <YummyText className="text-xs text-gray-500">
                    {loading ? 'Loading...' : `Showing ${filteredUsers.length} of ${totalUsers} users`}
                  </YummyText>
                </div>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {/* Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <YummyText>
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead className="border-b border-gray-100">
                      <tr>
                        <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="w-[15%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          Name
                        </th>
                        <th className="w-[18%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          Location
                        </th>
                        <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          Role
                        </th>
                        <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-[#0A0A0A] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredUsers.map((user, index) => {
                        const userStatus = getUserStatus(user);
                        const userId = user.userId || user._id || user.id;
                        const userName = user.fullName || user.name || 'N/A';
                        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
                        const locationRaw = user.location || user.address || '';
                        const locationStr = formatAddress(locationRaw) || 'N/A';

                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-4 whitespace-nowrap">
                              <YummyText className="text-sm font-medium text-[#101828]">
                                {userId?.substring(0, 8) || 'N/A'}
                              </YummyText>
                            </td>
                            <td className="px-3 py-4">
                              <div>
                                <YummyText className="text-sm font-medium text-[#101828] truncate">{userName}</YummyText>
                                <YummyText className="text-xs text-[#4A5565]">Joined {createdAt}</YummyText>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center text-xs text-[#4A5565]">
                                  <Mail className="w-3 h-3 mr-1 text-[#4A5565] flex-shrink-0" />
                                  <span className="truncate">{user.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-xs text-[#4A5565]">
                                  <Phone className="w-3 h-3 mr-1 text-[#4A5565] flex-shrink-0" />
                                  <span className="truncate">{user.phoneNumber || user.phone || 'N/A'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex items-center text-xs gap-1 text-[#4A5565]">
                                <LocationIcon width={13} height={13} stroke="#4A5565" />
                                <span className="truncate">{locationStr}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user.role || 'customer'}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <YummyText className="text-xs text-[#4A5565]">{createdAt}</YummyText>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${userStatus.color}`}>
                                {userStatus.status}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteUser(userId)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </YummyText>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => fetchUsers(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchUsers(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageUsers;