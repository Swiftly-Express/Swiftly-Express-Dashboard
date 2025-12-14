import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await getUsers();
      // setUsers(response.data);
      setUsers([]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToastMsg('Failed to load users');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <IonPage>
        <AdminLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9333EA] mx-auto mb-4"></div>
                <p className="text-[#64748B]">Loading users...</p>
              </div>
            </div>
          </IonContent>
        </AdminLayout>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-padding">
          <YummyText>
            <div className="mb-6">
              <h1 className="text-3xl font-medium text-[#0F172A] mb-2">Manage Users</h1>
              <p className="text-[#64748B]">View and manage all platform users</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9333EA]"
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9333EA]"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="rider">Riders</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#64748B]">No users found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#64748B] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4">{user.name}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{user.role}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-[#9333EA] hover:underline text-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </YummyText>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default ManageUsers;
