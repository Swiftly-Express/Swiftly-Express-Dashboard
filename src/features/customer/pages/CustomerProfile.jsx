import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast, IonIcon } from '@ionic/react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import CustomerLayout from '../components/CustomerLayout';
import { YummyText } from '../../../components/YummyText';
import Loader from '../../../components/Loader';
import {
  getCustomerProfile,
  updateCustomerProfile,
  uploadProfileImage,
  changePassword
} from '../../../utils/authApi';
import { getJSONCookie, setJSONCookie, setCookie } from '../../../utils/cookies';
import { useHistory } from 'react-router-dom';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const loadGoogleProfileData = () => {
  console.log('[CustomerProfile] Loading Google profile data...');

  const cachedUserData = getJSONCookie('user_data');
  if (!cachedUserData) {
    console.log('[CustomerProfile] No cached user_data found');
    return null;
  }

  const googleName = cachedUserData.name || cachedUserData.fullName || cachedUserData.displayName || '';
  const googleEmail = cachedUserData.email || '';
  const googlePhoto = cachedUserData.profilePhoto || cachedUserData.picture || cachedUserData.avatar || '';
  const googlePhone = cachedUserData.phone || cachedUserData.phoneNumber || '';

  const nameParts = googleName.split(' ');
  const firstName = cachedUserData.firstName || cachedUserData.given_name || nameParts[0] || '';
  const lastName = cachedUserData.lastName || cachedUserData.family_name || nameParts.slice(1).join(' ') || '';
  const googleId = cachedUserData.id || cachedUserData._id || cachedUserData.googleId || '';

  console.log('[CustomerProfile] Google data extracted:', {
    name: googleName,
    email: googleEmail,
    phone: googlePhone,
    hasPhoto: !!googlePhoto
  });

  return {
    fullName: googleName,
    firstName,
    lastName,
    email: googleEmail,
    phone: googlePhone,
    photo: googlePhoto,
    id: googleId
  };
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
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const history = useHistory();

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // First, try to load Google profile data from cookies
      const googleData = loadGoogleProfileData();

      if (googleData) {
        console.log('[CustomerProfile] Using Google profile data');
        
        // Set form data from Google
        setFormData(prev => ({
          ...prev,
          fullName: googleData.fullName || prev.fullName,
          email: googleData.email || prev.email,
          phone: googleData.phone || prev.phone
        }));

        // Set profile image from Google
        if (googleData.photo) {
          setProfileImage(googleData.photo);
          localStorage.setItem('profile_image', googleData.photo);
          setCookie('profile_image', googleData.photo, 7);
          console.log('[CustomerProfile] Google profile photo loaded');
        }
      } else {
        // Fallback to localStorage if no Google data
        const cachedUserData = localStorage.getItem('user_data');
        const cachedProfileImage = localStorage.getItem('profile_image');

        if (cachedUserData) {
          try {
            const userData = JSON.parse(cachedUserData);
            console.log('[CustomerProfile] Loading cached user data:', userData);

            setFormData(prev => ({
              ...prev,
              fullName: userData?.fullName || userData?.name || '',
              email: userData?.email || '',
              phone: userData?.phone || userData?.phoneNumber || ''
            }));
          } catch (e) {
            console.warn('[CustomerProfile] Failed to parse cached user data:', e);
          }
        }

        if (cachedProfileImage) {
          setProfileImage(cachedProfileImage);
          console.log('[CustomerProfile] Loaded cached profile image');
        }
      }

      // Then fetch from server and merge with existing data
      console.log('[CustomerProfile] Fetching customer profile from server...');
      const profile = await getCustomerProfile();
      console.log('[CustomerProfile] Profile data from server:', profile);

      // Handle different response structures
      const data = profile?.data || profile;

      // Merge server data with existing form data (keeping Google data as priority for basic fields)
      setFormData(prev => ({
        fullName: prev.fullName || data?.fullName || data?.full_name || data?.name || '',
        email: prev.email || data?.email || '',
        phone: prev.phone || data?.phone || data?.phoneNumber || data?.phone_number || '',
        street: data?.address?.street || prev.street || '',
        city: data?.address?.city || prev.city || '',
        state: data?.address?.state || prev.state || '',
        zipCode: data?.address?.zipCode || data?.address?.zip_code || prev.zipCode || '',
        country: data?.address?.country || prev.country || 'Nigeria'
      }));

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

      // Use dedicated change-password endpoint. Backend expects `password` and `confirmPassword`.
      const response = await changePassword({
        password: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
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
          <div className="mb-4 mt-4 md:mt-0 sm:mt-0">
            <YummyText>
              <div className="text-2xl sm:text-3xl font-medium text-[#0F172A] mb-0 text-left md:text-left">
                Profile Settings
              </div>
              <div className="text-[#4A5565] text-sm sm:text-[15px] font-[400] text-left md:text-left">
                Manage your account and preferences
              </div>
            </YummyText>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-8 bg-gray-100 p-1 px-1.5 md:px-0 rounded-full w-full md:w-fit overflow-x-auto md:overflow-visible">
            <YummyText>
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-6 md:px-12 py-2 rounded-full text-xs md:text-sm font-normal transition-colors whitespace-nowrap flex-shrink-0 md:flex-shrink ${activeTab === 'personal'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
                  }`}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 md:px-12 py-2 rounded-full text-xs md:text-sm font-normal transition-colors whitespace-nowrap flex-shrink-0 md:flex-shrink ${activeTab === 'security'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
                  }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-8 md:px-12 py-2 rounded-full text-xs md:text-sm font-normal transition-colors whitespace-nowrap flex-shrink-0 md:flex-shrink ${activeTab === 'notifications'
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
            <div className="py-6">
              <Loader message="Loading profile..." />
            </div>
          )}

          {/* Personal Tab */}
          {activeTab === 'personal' && !loading && (
            <div className="bg-white rounded-2xl p-4 sm:p-6" style={sideBottomShadow}>
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
                <div className="flex flex-col items-center gap-3">
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
                  <div className="text-center">
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
                        className={`inline-flex items-center gap-2 shadow-sm py-2 px-4 rounded-xl text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-[#00D68F]'} text-[#0F172A] transition-colors mb-1`}
                        style={{ border: "1px solid #64748B" }}
                      >
                        <img src="/cameraicon.svg" alt="Change" className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Change Photo'}
                      </label>
                      <div className="text-xs text-[#64748B] mt-1">
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
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Email Address - Read Only */}
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
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
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
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
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
                      />
                    </div>

                    {/* City and State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
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
                          className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
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
                        className="w-full placeholder:text-[#94A3B8] px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
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
              <div className="bg-white rounded-2xl p-4 sm:p-6" style={sideBottomShadow}>
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
                        <div className="relative">
                          <input
                            type={showPasswords.currentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
                            className="absolute right-3 top-3 text-gray-500"
                            aria-label={showPasswords.currentPassword ? 'Hide password' : 'Show password'}
                          >
                            <IonIcon icon={showPasswords.currentPassword ? eyeOffOutline : eyeOutline} className="w-5 h-5 text-[#1E1E1E]" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.newPassword ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                            className="absolute right-3 top-3 text-gray-500"
                            aria-label={showPasswords.newPassword ? 'Hide password' : 'Show password'}
                          >
                            <IonIcon icon={showPasswords.newPassword ? eyeOffOutline : eyeOutline} className="w-5 h-5 text-[#1E1E1E]" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0F172A] mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:ring-2 focus:ring-[#00D68F]/20 focus:outline-none transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                            className="absolute right-3 top-3 text-gray-500"
                            aria-label={showPasswords.confirmPassword ? 'Hide password' : 'Show password'}
                          >
                            <IonIcon icon={showPasswords.confirmPassword ? eyeOffOutline : eyeOutline} className="w-5 h-5 text-[#1E1E1E]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2.5 bg-[#00B75A] ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00B876]'} text-white rounded-full transition-colors font-normal`}
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>

                      <button
                        type="button"
                        onClick={() => history.push('/forgot-password?role=customer')}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-[#0F172A] rounded-full transition-colors hover:bg-gray-50"
                      >
                        Forgot Password
                      </button>
                    </div>
                  </YummyText>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white rounded-2xl p-4 sm:p-6" style={sideBottomShadow}>
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
            <div className="bg-white rounded-2xl p-4 sm:p-6" style={sideBottomShadow}>
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