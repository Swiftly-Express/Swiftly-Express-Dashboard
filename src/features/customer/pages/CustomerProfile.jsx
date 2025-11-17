import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';


const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, New York, NY 10001'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    newsletter: false
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationToggle = (name) => {
    setNotifications({
      ...notifications,
      [name]: !notifications[name]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updating profile:', formData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    console.log('Updating password:', passwordData);
  };

  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    console.log('Saving preferences:', notifications);
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Profile Settings
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Manage your account and preferences
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-2 rounded-lg text-sm font-normal transition-colors ${
                activeTab === 'personal'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-2 rounded-lg text-sm font-normal transition-colors ${
                activeTab === 'security'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-2 rounded-lg text-sm font-normal transition-colors ${
                activeTab === 'notifications'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Notifications
            </button>
          </div>

          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
              <div className="mb-6">
                <div className="text-xl font-normal text-[#0F172A] mb-1">
                  Personal Information
                </div>
                <div className="text-sm text-[#64748B]">
                  Update your personal details
                </div>
              </div>

              {/* Profile Photo */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                    alt="Profile"
                    className="w-20 h-20 rounded-full"
                  />
                  <div>
                    <button className="flex items-center gap-2 text-sm text-[#0F172A] hover:text-[#00D68F] transition-colors mb-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" fill="currentColor"/>
                      </svg>
                      Change Photo
                    </button>
                    <div className="text-xs text-[#64748B]">JPG, PNG or GIF. Max 2MB</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#00B75A] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
                <div className="mb-6">
                  <div className="text-xl font-normal text-[#0F172A] mb-1">
                    Change Password
                  </div>
                  <div className="text-sm text-[#64748B]">
                    Update your password regularly for security
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-6 px-6 py-2.5 bg-[#00B75A] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
                <div className="mb-6">
                  <div className="text-xl font-normal text-[#0F172A] mb-1">
                    Two-Factor Authentication
                  </div>
                  <div className="text-sm text-[#64748B]">
                    Add an extra layer of security to your account
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <div className="text-sm font-medium text-[#0F172A] mb-1">Enable 2FA</div>
                    <div className="text-xs text-[#64748B]">Receive a code on your phone for login</div>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D68F]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
              <div className="mb-6">
                <div className="text-xl font-normal text-[#0F172A] mb-1">
                  Notification Preferences
                </div>
                <div className="text-sm text-[#64748B]">
                  Choose what updates you want to receive
                </div>
              </div>

              <form onSubmit={handleNotificationSubmit}>
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-[#0F172A] mb-1">Email Notifications</div>
                      <div className="text-xs text-[#64748B]">Receive delivery updates via email</div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.emailNotifications}
                        onChange={() => handleNotificationToggle('emailNotifications')}
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F172A]"></div>
                    </label>
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-[#0F172A] mb-1">SMS Notifications</div>
                      <div className="text-xs text-[#64748B]">Get text messages for important updates</div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.smsNotifications}
                        onChange={() => handleNotificationToggle('smsNotifications')}
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F172A]"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-[#0F172A] mb-1">Push Notifications</div>
                      <div className="text-xs text-[#64748B]">Mobile app notifications</div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.pushNotifications}
                        onChange={() => handleNotificationToggle('pushNotifications')}
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F172A]"></div>
                    </label>
                  </div>

                  {/* Marketing Emails */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-[#0F172A] mb-1">Marketing Emails</div>
                      <div className="text-xs text-[#64748B]">Promotions and special offers</div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.marketingEmails}
                        onChange={() => handleNotificationToggle('marketingEmails')}
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"></div>
                    </label>
                  </div>

                  {/* Newsletter */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <div className="text-sm font-medium text-[#0F172A] mb-1">Newsletter</div>
                      <div className="text-xs text-[#64748B]">Monthly updates and news</div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.newsletter}
                        onChange={() => handleNotificationToggle('newsletter')}
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"></div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 px-6 py-2.5 bg-[#00B75A] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                >
                  Save Preferences
                </button>
              </form>
            </div>
          )}
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default CustomerProfile;