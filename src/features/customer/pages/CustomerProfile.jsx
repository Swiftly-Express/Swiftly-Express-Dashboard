import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import { 
  getCustomerProfile, 
  updateCustomerProfile, 
  uploadProfileImage 
} from '../../../utils/authApi';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profileImage, setProfileImage] = useState('/profileimage.svg');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria'
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

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // First, load from localStorage for immediate display
      const cachedUserData = localStorage.getItem('user_data');
      const cachedProfileImage = localStorage.getItem('profile_image');
      
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          console.log('[Profile] Loading cached user data:', userData);
          
          setFormData({
            fullName: userData?.fullName || userData?.name || '',
            email: userData?.email || '',
            phone: userData?.phone || userData?.phoneNumber || '',
            street: userData?.address?.street || '',
            city: userData?.address?.city || '',
            state: userData?.address?.state || '',
            zipCode: userData?.address?.zipCode || '',
            country: userData?.address?.country || 'Nigeria'
          });
        } catch (e) {
          console.warn('[Profile] Failed to parse cached user data:', e);
        }
      }
      
      if (cachedProfileImage) {
        setProfileImage(cachedProfileImage);
        console.log('[Profile] Loaded cached profile image');
      }
      
      // Then fetch from server and update
      console.log('[Profile] Fetching customer profile from server...');
      const profile = await getCustomerProfile();
      console.log('[Profile] Profile data from server:', profile);
      
      // Handle different response structures
      const data = profile?.data || profile;
      
      setFormData({
        fullName: data?.fullName || data?.full_name || data?.name || '',
        email: data?.email || '',
        phone: data?.phone || data?.phoneNumber || data?.phone_number || '',
        street: data?.address?.street || '',
        city: data?.address?.city || '',
        state: data?.address?.state || '',
        zipCode: data?.address?.zipCode || data?.address?.zip_code || '',
        country: data?.address?.country || 'Nigeria'
      });
      
      // Set profile image if available from server, otherwise keep cached
      const serverImage = data?.profileImage || data?.profile_image || data?.avatar;
      if (serverImage) {
        setProfileImage(serverImage);
        localStorage.setItem('profile_image', serverImage);
      }
      
      // Set notification preferences if available
      if (data?.notificationPreferences || data?.notification_preferences) {
        const prefs = data.notificationPreferences || data.notification_preferences;
        setNotifications({
          emailNotifications: prefs.emailNotifications ?? prefs.email ?? true,
          smsNotifications: prefs.smsNotifications ?? prefs.sms ?? true,
          pushNotifications: prefs.pushNotifications ?? prefs.push ?? true,
          marketingEmails: prefs.marketingEmails ?? prefs.marketing ?? false,
          newsletter: prefs.newsletter ?? false
        });
      }
      
    } catch (err) {
      console.error('[Profile] Failed to fetch profile:', err);
      setToastMsg(err?.message || 'Failed to load profile');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setToastMsg('Please upload a JPG, PNG, or GIF image');
      setShowToast(true);
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToastMsg('File size must be less than 2MB');
      setShowToast(true);
      return;
    }

    setUploading(true);
    
    try {
      console.log('[Profile] Uploading profile image...');
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await uploadProfileImage(formData);
      console.log('[Profile] Upload response:', response);
      
      // Update profile image
      const imageUrl = response?.imageUrl || response?.data?.imageUrl || response?.url || response?.data?.url;
      
      if (imageUrl) {
        setProfileImage(imageUrl);
        // Persist to localStorage
        localStorage.setItem('profile_image', imageUrl);
        console.log('[Profile] Saved profile image to localStorage:', imageUrl);
        
        // Dispatch event to notify other components (like CustomerLayout)
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: { profileImage: imageUrl }
        }));
        console.log('[Profile] Dispatched profile:updated event for image');
        
        setToastMsg('Profile photo updated successfully!');
      } else {
        // If no URL returned, create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result);
          // Persist to localStorage
          localStorage.setItem('profile_image', reader.result);
          console.log('[Profile] Saved preview image to localStorage');
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('profile:updated', {
            detail: { profileImage: reader.result }
          }));
          console.log('[Profile] Dispatched profile:updated event for preview image');
        };
        reader.readAsDataURL(file);
        setToastMsg('Profile photo updated!');
      }
      
      setShowToast(true);
      
    } catch (err) {
      console.error('[Profile] Failed to upload image:', err);
      setToastMsg(err?.message || 'Failed to upload image');
      setShowToast(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('[Profile] Updating profile:', formData);
      
      // Prepare payload - exclude email and format address as object
      // Backend doesn't accept 'country' or 'coordinates' in address
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      };
      
      console.log('[Profile] Payload:', payload);
      
      const response = await updateCustomerProfile(payload);
      console.log('[Profile] Update response:', response);
      
      // Refetch profile to get the latest data from backend
      try {
        const updatedProfile = await getCustomerProfile();
        const data = updatedProfile?.data || updatedProfile;
        
        console.log('[Profile] Refetched profile after update:', data);
        
        // Update localStorage with fresh data from server
        const existingData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const updatedUserData = {
          ...existingData,
          fullName: data?.fullName || data?.full_name || formData.fullName,
          name: data?.fullName || data?.full_name || formData.fullName,
          email: data?.email || formData.email,
          phone: data?.phone || data?.phoneNumber || formData.phone,
          address: data?.address || {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          }
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
        console.log('[Profile] Updated localStorage with fresh profile data:', updatedUserData);
        
        // Dispatch event to notify other components (like Dashboard) of profile update
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: updatedUserData
        }));
        console.log('[Profile] Dispatched profile:updated event');
        
        // Update form with fresh data
        setFormData({
          fullName: data?.fullName || data?.full_name || data?.name || formData.fullName,
          email: data?.email || formData.email,
          phone: data?.phone || data?.phoneNumber || data?.phone_number || formData.phone,
          street: data?.address?.street || formData.street,
          city: data?.address?.city || formData.city,
          state: data?.address?.state || formData.state,
          zipCode: data?.address?.zipCode || data?.address?.zip_code || formData.zipCode,
          country: data?.address?.country || 'Nigeria'
        });
      } catch (e) {
        console.warn('[Profile] Failed to refetch profile, using form data:', e);
        // Fallback: update localStorage with form data
        const existingData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const updatedUserData = {
          ...existingData,
          fullName: formData.fullName,
          name: formData.fullName,
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          }
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: updatedUserData
        }));
      }
      
      setToastMsg('Profile updated successfully!');
      setShowToast(true);
      
    } catch (err) {
      console.error('[Profile] Failed to update profile:', err);
      setToastMsg(err?.message || 'Failed to update profile');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToastMsg('New passwords do not match');
      setShowToast(true);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setToastMsg('Password must be at least 6 characters');
      setShowToast(true);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('[Profile] Updating password...');
      
      const response = await updateCustomerProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      console.log('[Profile] Password update response:', response);
      
      setToastMsg('Password updated successfully!');
      setShowToast(true);
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      console.error('[Profile] Failed to update password:', err);
      setToastMsg(err?.message || 'Failed to update password');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('[Profile] Saving notification preferences:', notifications);
      
      const response = await updateCustomerProfile({
        notificationPreferences: notifications
      });
      
      console.log('[Profile] Preferences update response:', response);
      
      setToastMsg('Preferences saved successfully!');
      setShowToast(true);
      
    } catch (err) {
      console.error('[Profile] Failed to save preferences:', err);
      setToastMsg(err?.message || 'Failed to save preferences');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />

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

          {/* Loading State */}
          {loading && activeTab === 'personal' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#00B75A]"></div>
              <p className="mt-4 text-[#64748B]">Loading profile...</p>
            </div>
          )}

          {/* Personal Tab */}
          {activeTab === 'personal' && !loading && (
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
                  <div className="relative">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <YummyText>
                      <input
                        type="file"
                        id="profilePhotoInput"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handlePhotoChange}
                        disabled={uploading}
                        className="hidden"
                      />
                      <label 
                        htmlFor="profilePhotoInput"
                        className={`flex items-center gap-2 shadow-sm py-2 px-4 rounded-xl text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-[#00D68F]'} text-[#0F172A] transition-colors mb-1`}
                        style={{border: "1px solid #64748B"}}
                      >
                        <img src="/cameraicon.svg" alt="Change" className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Change Photo'}
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
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder='John Doe'
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        required
                      />
                    </div>

                    {/* Email Address - Read Only */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Email Address
                        <span className="text-xs text-[#64748B] ml-2">(Cannot be changed)</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl bg-gray-100 text-[#64748B] cursor-not-allowed border-none"
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
                        placeholder='+234 800 000 0000'
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        required
                      />
                    </div>

                    {/* Address - Street */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder='123 Main Street'
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>

                    {/* City and State */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder='Lagos'
                          className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder='Lagos State'
                          className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                        />
                      </div>
                    </div>

                    {/* Zip Code */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Zip/Postal Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder='100001'
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00D68F] border-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-7 py-2 bg-[#00B75A] ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00B876]'} text-white rounded-xl transition-colors font-normal`}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
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
                          required
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
                          required
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
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-6 px-6 py-2.5 bg-[#00B75A] ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00B876]'} text-white rounded-xl transition-colors font-normal`}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
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
                  <YummyText> 
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
                    disabled={loading}
                    className={`mt-6 px-6 py-2.5 bg-[#00B75A] ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00B876]'} text-white rounded-xl transition-colors font-normal`}
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
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