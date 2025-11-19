import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';


const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profileImage, setProfileImage] = useState('/profileimage.svg');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, PNG, or GIF image');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
            <YummyText>
              <div className="text-3xl font-medium text-[#0F172A] mb-2">
                Profile Settings
              </div>
              <div className="text-[#4A5565] text-[15px] font-[400]">
                Manage your account and preferences
              </div>
            </YummyText>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-8 bg-gray-100 p-1 rounded-full w-fit">
            <YummyText>
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-12 py-2 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'personal'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-12 py-2 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'security'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-12 py-2 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'notifications'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Notifications
            </button>
            </YummyText>
          </div>

          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
              <div className="mb-6">
                <YummyText>
                <div className="text-lg font-normal text-[#0F172A]">
                  Personal Information
                </div>
                <div className="text-medium text-[#717182]">
                  Update your personal details
                </div>
                </YummyText>
              </div>

              {/* Profile Photo */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <YummyText>
                      <input
                        type="file"
                        id="profilePhotoInput"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="profilePhotoInput"
                        className="flex items-center gap-2 shadow-sm py-2 px-4 rounded-xl text-sm text-[#0F172A] hover:text-[#00D68F] transition-colors mb-1 cursor-pointer"
                        style={{border: "1px solid #64748B"}}
                      >
                        <img src="/cameraicon.svg" alt="Change" className="w-4 h-4" />
                        Change Photo
                      </label>
                      <div className="text-xs text-[#64748B]">
                        JPG, PNG or GIF. Max 2MB
                      </div>
                    </YummyText>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <YummyText>
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
                        placeholder='John'
                        className="w-full placeholder:text-[#0A0A0A] px-4 py-3  rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                        placeholder='Doe'
                        className="w-full placeholder:text-[#0A0A0A] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                      placeholder='john.doe@gmail.com'
                      className="w-full placeholder:text-[#0A0A0A] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                      placeholder='+1 (555) 123-4567'
                      className="w-full placeholder:text-[#0A0A0A] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
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
                      placeholder='123 Main Street, New York, NY 10001'
                      className="w-full placeholder:text-[#0A0A0A] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                    />
                  </div>
                </div>

                <div className="flex justify-start mt-6">
                  <button
                    type="submit"
                    className="px-7 py-2 bg-[#00B75A] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                  >
                    Save Changes
                  </button>
                </div>
                </YummyText>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                <YummyText>
                  <div className="mb-6">
                    <div className="text-xl font-normal text-[#0F172A] mb-1">
                      Change Password
                    </div>
                    <div className="text-sm text-[#64748B]">
                      Update your password regularly for security
                    </div>
                  </div>
                </YummyText>

                <form onSubmit={handlePasswordSubmit}>
                  <YummyText>
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
                  </YummyText>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
                <YummyText>
                <div className="mb-6">
                  <div className="text-xl font-normal text-[#0F172A] mb-1">
                    Two-Factor Authentication
                  </div>
                  <div className="text-sm text-[#64748B]">
                    Add an extra layer of security to your account
                  </div>
                </div>
                </YummyText>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <YummyText>
                    <div className="text-sm font-medium text-[#0F172A] mb-1">Enable 2FA</div>
                    <div className="text-xs text-[#64748B]">Receive a code on your phone for login</div>
                    </YummyText>
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
            <div className="bg-white rounded-2xl p-6" style={sideBottomShadow}>
              <YummyText>
              <div className="mb-6">
                <div className="text-xl font-normal text-[#0F172A] mb-1">
                  Notification Preferences
                </div>
                <div className="text-sm text-[#64748B]">
                  Choose what updates you want to receive
                </div>
              </div>
              </YummyText>

              <form onSubmit={handleNotificationSubmit}>
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <YummyText> 
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
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F172A]"></div>
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
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F172A]"></div>
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
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F172A]"></div>
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
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"></div>
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
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"></div>
                    </label>
                  </div>
                  </YummyText>
                </div>

                <YummyText>
                <button
                  type="submit"
                  className="mt-6 px-6 py-2.5 bg-[#00B75A] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                >
                  Save Preferences
                </button>
                </YummyText>
              </form>
            </div>
          )}
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default CustomerProfile;