import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import DocumentIcon from "../../../icons/Documenticon";
import UploadIcon from "../../../icons/Uploadicon";
import { getRiderProfile, updateRiderProfile, uploadRiderProfileImage, getRiderEarnings } from '../../../utils/authApi';
import { getCookie, setCookie, getJSONCookie, setJSONCookie } from '../../../utils/cookies';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const generateMockAvatar = (name) => {
  if (!name || name === 'Rider') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rider';
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
};

const getProfileImageKey = () => {
  try {
    const userData = getJSONCookie('user_data');
    if (userData) {
      const userId = userData.id || userData._id || userData.email;
      if (userId) {
        return `profile_image_${userId}`;
      }
    }
  } catch (e) {
    console.error('[Profile] Error getting user ID:', e);
  }
  return 'profile_image';
};

const RiderProfile = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('riderProfileTab') || 'personal';
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: ''
  });
  
  const [vehicleInfo, setVehicleInfo] = useState({
    type: '',
    makeModel: '',
    year: '',
    color: '',
    licensePlate: '',
    insurancePolicy: ''
  });

  const [userName, setUserName] = useState(() => {
    const cachedUserData = getJSONCookie('user_data');
    if (cachedUserData) {
      try {
        const name = cachedUserData.fullName || `${cachedUserData.firstName || ''} ${cachedUserData.lastName || ''}`.trim();
        return name || 'Rider';
      } catch (e) {
        return 'Rider';
      }
    }
    return 'Rider';
  });

  const [riderId, setRiderId] = useState(() => {
    const cachedUserData = getJSONCookie('user_data');
    if (cachedUserData) {
      try {
        return cachedUserData.riderId || cachedUserData.driverId || (cachedUserData.id ? `RD-${cachedUserData.id}` : '');
      } catch (e) {
        return '';
      }
    }
    return '';
  });

  const [profileImage, setProfileImage] = useState(() => {
    const imageKey = getProfileImageKey();
    const cachedImage = getCookie(imageKey);
    if (cachedImage && !cachedImage.includes('dicebear') && !cachedImage.includes('profileimage.svg')) {
      return cachedImage;
    }
    const cachedUserData = getJSONCookie('user_data');
    if (cachedUserData) {
      try {
        const name = cachedUserData.fullName || `${cachedUserData.firstName || ''} ${cachedUserData.lastName || ''}`.trim();
        return generateMockAvatar(name);
      } catch (e) {
        return generateMockAvatar('Rider');
      }
    }
    return generateMockAvatar('Rider');
  });

  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const [documents, setDocuments] = useState({
    driversLicense: { uploaded: true, verified: true, expires: 'Dec 15, 2026' },
    vehicleRegistration: { uploaded: true, verified: true, expires: 'Aug 20, 2025' },
    insuranceCertificate: { uploaded: true, verified: true, expires: 'Nov 30, 2025' },
    backgroundCheck: { uploaded: true, verified: false, lastUpdated: '6 months ago' }
  });

  const [stats, setStats] = useState({
    totalDeliveries: 0,
    rating: 0,
    totalRatings: 0,
    successRate: 0,
    memberSince: 'Loading...'
  });

  const profileImageInputRef = useRef(null);
  const driversLicenseInputRef = useRef(null);
  const vehicleRegistrationInputRef = useRef(null);
  const insuranceCertificateInputRef = useRef(null);
  const backgroundCheckInputRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('riderProfileTab', activeTab);
  }, [activeTab]);

  // Load saved data from cookies on mount
  useEffect(() => {
    // Load personal info
    const savedPersonalInfo = getJSONCookie('riderPersonalInfo');
    if (savedPersonalInfo) {
      try {
        setPersonalInfo(savedPersonalInfo);
      } catch (e) {
        console.error('[Profile] Error parsing saved personal info:', e);
      }
    }
    
    // Load vehicle info
    const savedVehicleInfo = getJSONCookie('riderVehicleInfo');
    if (savedVehicleInfo) {
      try {
        setVehicleInfo(savedVehicleInfo);
      } catch (e) {
        console.error('[Profile] Error parsing saved vehicle info:', e);
      }
    }
    
    // Load verification data if available
    const verificationData = getJSONCookie('riderVerificationData');
    if (verificationData) {
      try {
        console.log('[Profile] Loading verification data:', verificationData);
        
        // Update personal info with contact info
        if (verificationData.contactInfo) {
          setPersonalInfo(prev => ({
            ...prev,
            phone: verificationData.contactInfo.phone || prev.phone,
            address: `${verificationData.contactInfo.streetAddress || ''}, ${verificationData.contactInfo.city || ''}, ${verificationData.contactInfo.state || ''} ${verificationData.contactInfo.zipCode || ''}`.trim() || prev.address
          }));
        }
        
        // Update vehicle info
        if (verificationData.vehicle) {
          setVehicleInfo(prev => ({
            ...prev,
            type: verificationData.vehicle.type || prev.type,
            makeModel: verificationData.vehicle.makeModel || prev.makeModel,
            year: verificationData.vehicle.year || prev.year,
            licensePlate: verificationData.vehicle.licensePlate || prev.licensePlate
          }));
        }
      } catch (e) {
        console.error('[Profile] Error loading verification data:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    
    const handleVerificationComplete = (event) => {
      console.log('[Profile] Verification completed, refreshing profile and data');
      fetchProfile();
      
      // Reload verification data from cookies
      const verificationData = getJSONCookie('riderVerificationData');
      if (verificationData) {
        console.log('[Profile] Syncing verification data to profile:', verificationData);
        
        // Update personal info with contact info
        if (verificationData.contactInfo) {
          setPersonalInfo(prev => ({
            ...prev,
            phone: verificationData.contactInfo.phone || prev.phone,
            address: `${verificationData.contactInfo.streetAddress || ''}, ${verificationData.contactInfo.city || ''}, ${verificationData.contactInfo.state || ''} ${verificationData.contactInfo.zipCode || ''}`.trim() || prev.address
          }));
        }
        
        // Update vehicle info
        if (verificationData.vehicle) {
          setVehicleInfo(prev => ({
            ...prev,
            type: verificationData.vehicle.type || prev.type,
            makeModel: verificationData.vehicle.makeModel || prev.makeModel,
            year: verificationData.vehicle.year || prev.year,
            licensePlate: verificationData.vehicle.licensePlate || prev.licensePlate
          }));
        }
        
        console.log('[Profile] ✓ Profile data synced with verification data');
      }
    };
    
    window.addEventListener('verification:completed', handleVerificationComplete);
    
    return () => {
      window.removeEventListener('verification:completed', handleVerificationComplete);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const token = getCookie('rider_token') || getCookie('auth_token');
      if (!token) {
        console.log('[Profile] No token found, skipping API call');
        setLoading(false);
        return;
      }
      
      const imageKey = getProfileImageKey();
      const cachedImage = getCookie(imageKey);
      if (cachedImage) {
        setProfileImage(cachedImage);
      }
      
      const cachedUserData = getJSONCookie('user_data');
      if (cachedUserData) {
        try {
          const user = JSON.parse(cachedUserData);
          const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
          if (name) setUserName(name);
          if (user.riderId || user.driverId || user.id) {
            setRiderId(user.riderId || user.driverId || `RD-${user.id}`);
          }
          setPersonalInfo(prev => ({
            ...prev,
            firstName: user.firstName || prev.firstName,
            lastName: user.lastName || prev.lastName,
            email: user.email || prev.email,
            phone: user.phone || prev.phone
          }));
        } catch (e) {
          console.error('[Profile] Failed to parse cached user data:', e);
        }
      }
      
      const response = await getRiderProfile();
      const profile = response?.data?.driver || response?.driver || response?.data;
      setProfileData(profile);
      
      // Fetch stats
      try {
        const earningsRes = await getRiderEarnings();
        const earnings = earningsRes?.data || earningsRes;
        
        const totalDeliveries = earnings?.totalDeliveries || earnings?.total?.count || profile?.totalDeliveries || 0;
        const rating = profile?.rating || profile?.averageRating || 0;
        const totalRatings = profile?.totalRatings || profile?.ratingsCount || 0;
        const successRate = profile?.successRate || (profile?.completedDeliveries && totalDeliveries ? (profile.completedDeliveries / totalDeliveries * 100) : 0);
        const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';
        
        setStats({
          totalDeliveries,
          rating: Number(rating).toFixed(2),
          totalRatings,
          successRate: Number(successRate).toFixed(0),
          memberSince
        });
        
        console.log('[Profile] Stats loaded:', { totalDeliveries, rating, totalRatings, successRate, memberSince });
      } catch (statsError) {
        console.error('[Profile] Failed to load stats:', statsError);
      }
      
      if (profile?.profilePhoto && !profile.profilePhoto.includes('dicebear')) {
        setProfileImage(profile.profilePhoto);
        setCookie(imageKey, profile.profilePhoto, 7);
      } else if (!cachedImage || cachedImage.includes('dicebear') || cachedImage.includes('profileimage.svg')) {
        const name = profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || userName;
        const mockAvatar = generateMockAvatar(name);
        setProfileImage(mockAvatar);
      }
      
      if (profile) {
        const name = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (name) {
          setUserName(name);
        }
        
        if (profile.riderId || profile.driverId || profile.id) {
          setRiderId(profile.riderId || profile.driverId || `RD-${profile.id}`);
        }
        
        setPersonalInfo(prev => ({
          ...prev,
          firstName: profile.firstName || prev.firstName,
          lastName: profile.lastName || prev.lastName,
          email: profile.email || prev.email,
          phone: profile.phone || profile.contactInfo?.phone || prev.phone,
          address: profile.address || profile.contactInfo?.streetAddress || prev.address,
          emergencyContact: profile.emergencyContact || profile.contactInfo?.emergencyContact || prev.emergencyContact
        }));
        
        if (profile.vehicle) {
          setVehicleInfo(prev => ({
            ...prev,
            type: profile.vehicle.type || prev.type,
            makeModel: profile.vehicle.makeModel || prev.makeModel,
            year: profile.vehicle.year || prev.year,
            color: profile.vehicle.color || prev.color,
            licensePlate: profile.vehicle.licensePlate || prev.licensePlate,
            insurancePolicy: profile.vehicle.insurancePolicy || prev.insurancePolicy
          }));
        }
      }
      
      if (profile?.documents) {
        setDocuments(prev => ({
          ...prev,
          ...profile.documents
        }));
      }
      
      if (profile?.verificationStatus) {
        setCookie('riderVerificationStatus', profile.verificationStatus, 7);
      }
      
      console.log('[Profile] Profile loaded:', profile);
    } catch (error) {
      console.error('[Profile] Error fetching profile:', error);
      
      if (error.message?.includes('token') || error.message?.includes('Access denied')) {
        console.log('[Profile] Token error on load, user may need to log in');
        return;
      }
      
      if (error.message.includes('403') || error.message.includes('Insufficient permissions')) {
        setToastMsg('Access denied. Please logout and login as a rider.');
      } else {
        setToastMsg(error.message || 'Failed to load profile');
      }
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setToastMsg('Please upload a JPG, PNG, or GIF image');
      setShowToast(true);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setToastMsg('File size must be less than 5MB');
      setShowToast(true);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result;
      setProfileImage(previewUrl);
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { profileImage: previewUrl }
      }));
      console.log('[Profile] Dispatched immediate preview event');
    };
    reader.readAsDataURL(file);

    setUploading(true);
    
    try {
      console.log('[Profile] Uploading profile image...');
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await uploadRiderProfileImage(formData);
      console.log('[Profile] Upload response:', response);
      
      const imageUrl = response?.imageUrl || response?.data?.imageUrl || response?.url || response?.data?.url || response?.data?.driver?.profilePhoto || response?.driver?.profilePhoto;
      
      if (imageUrl) {
        setProfileImage(imageUrl);
        const imageKey = getProfileImageKey();
        setCookie(imageKey, imageUrl, 7);
        console.log('[Profile] Saved profile image to cookies:', imageUrl);
        
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: { profileImage: imageUrl }
        }));
        console.log('[Profile] Dispatched profile:updated event for image');
        
        setToastMsg('Profile photo updated successfully!');
      } else {
        console.log('[Profile] No URL returned, using local preview');
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result);
          const imageKey = getProfileImageKey();
          setCookie(imageKey, reader.result, 7);
          window.dispatchEvent(new CustomEvent('profile:updated', {
            detail: { profileImage: reader.result }
          }));
        };
        reader.readAsDataURL(file);
        setToastMsg('Profile photo updated!');
      }
      
      setShowToast(true);
    } catch (err) {
      console.error('[Profile] Upload failed:', err);
      setToastMsg(err?.message || 'Failed to upload image');
      setShowToast(true);
    } finally {
      setUploading(false);
    }
  };

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePersonalInfo = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage first (always works)
      const localStorageData = {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        address: personalInfo.address,
        emergencyContact: personalInfo.emergencyContact
      };
      setJSONCookie('riderPersonalInfo', localStorageData, 7);
      console.log('[Profile] Personal info saved to cookies');
      
      // Update user_data cookie
      const userData = getJSONCookie('user_data');
      if (userData) {
        try {
          const updatedUser = { 
            ...userData, 
            fullName: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
            phone: personalInfo.phone
          };
          setJSONCookie('user_data', updatedUser, 7);
        } catch (e) {
          console.error('[Profile] Failed to update cached user data:', e);
        }
      }
      
      // Update userName
      const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
      if (fullName) {
        setUserName(fullName);
      }
      
      // Try to update API with correct format
      try {
        const payload = {
          fullName: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
          phone: personalInfo.phone,
          contactInfo: {
            phone: personalInfo.phone,
            streetAddress: personalInfo.address,
            emergencyContact: personalInfo.emergencyContact
          }
        };
        
        console.log('[Profile] Updating API with payload:', payload);
        const response = await updateRiderProfile(payload);
        console.log('[Profile] API update response:', response);
      } catch (apiError) {
        console.warn('[Profile] API update failed (continuing with localStorage):', apiError);
      }
      
      setToastMsg('Personal information saved successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('[Profile] Failed to save personal info:', error);
      setToastMsg(error.message || 'Failed to save personal information');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleVehicleInfoChange = (field, value) => {
    setVehicleInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveVehicleInfo = async () => {
    try {
      setSaving(true);
      
      // Save to cookies first (always works)
      setJSONCookie('riderVehicleInfo', vehicleInfo, 7);
      console.log('[Profile] Vehicle info saved to cookies');
      
      // Try to update API
      try {
        const payload = {
          vehicle: {
            type: vehicleInfo.type,
            makeModel: vehicleInfo.makeModel,
            year: vehicleInfo.year,
            color: vehicleInfo.color,
            licensePlate: vehicleInfo.licensePlate,
            insurancePolicy: vehicleInfo.insurancePolicy
          }
        };
        
        console.log('[Profile] Updating vehicle API with payload:', payload);
        const response = await updateRiderProfile(payload);
        console.log('[Profile] Vehicle API update response:', response);
      } catch (apiError) {
        console.warn('[Profile] Vehicle API update failed (continuing with localStorage):', apiError);
      }
      
      setToastMsg('Vehicle information updated successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('[Profile] Failed to save vehicle info:', error);
      setToastMsg(error.message || 'Failed to update vehicle information');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = (documentType, e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }

      setDocuments(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          uploaded: true,
          verified: false,
          fileName: file.name
        }
      }));

      alert(`${file.name} uploaded successfully! It will be reviewed shortly.`);
    }
  };

  const calculateCompletion = () => {
    const totalFields = 4;
    let completed = 0;
    
    Object.values(documents).forEach(doc => {
      if (doc.uploaded && doc.verified) completed++;
    });

    return Math.round((completed / totalFields) * 100);
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 0 && percentage <= 45) {
      return { bar: 'bg-[#0F172A]', text: 'text-[#0F172A]' };
    } else if (percentage >= 46 && percentage <= 75) {
      return { bar: 'bg-orange-500', text: 'text-orange-600' };
    } else {
      return { bar: 'bg-[#00D68F]', text: 'text-[#00D68F]' };
    }
  };

  const getMissingDocuments = () => {
    const missing = [];
    if (!documents.driversLicense.verified) missing.push("Driver's License");
    if (!documents.vehicleRegistration.verified) missing.push("Vehicle Registration");
    if (!documents.insuranceCertificate.verified) missing.push("Insurance Certificate");
    if (!documents.backgroundCheck.verified) missing.push("Background Check");
    return missing;
  };

  const completionPercentage = calculateCompletion();
  const completionColors = getCompletionColor(completionPercentage);
  const missingDocs = getMissingDocuments();

  if (loading) {
    return (
      <IonPage>
        <RiderLayout>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D68F] mx-auto mb-4"></div>
                <p className="text-[#64748B]">Loading profile...</p>
              </div>
            </div>
          </IonContent>
        </RiderLayout>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          <YummyText>
          <div className="mb-4 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Rider Profile
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Manage your profile and documents
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-6 mb-8" style={sideBottomShadow}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={profileImage}
                    alt={userName}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-200 object-cover"
                  />
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => profileImageInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#00B75A] rounded-full flex items-center justify-center hover:bg-[#00B876] transition-colors" 
                    style={{border: "0.5px solid #FFFF"}}
                  >
                    <img src="/cameraicon.svg" alt="Edit" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
                  </button>
                </div>

                <div>
                  <div className="text-xl font-medium text-[#0F172A] mb-1">{userName}</div>
                  <div className="text-sm text-[#64748B] mb-3">{riderId ? `Rider ID: ${riderId}` : 'Rider'}</div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active Rider
                    </span>
                    <span className="px-3 py-1 bg-[#00D68F] text-white rounded-full text-xs font-medium">
                      Top Performer
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {stats.totalDeliveries > 0 ? `${stats.totalDeliveries}+ Deliveries` : 'New Rider'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          width="22" 
                          height="22" 
                          viewBox="0 0 24 24" 
                          fill={star <= Math.round(stats.rating) ? "#00D68F" : "#E5E7EB"}
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2.75c.28 0 .53.16.65.41l2.12 4.3c.1.21.3.35.53.38l4.75.69c.69.1.97.95.47 1.43l-3.44 3.35c-.17.16-.25.39-.21.62l.81 4.72c.12.69-.61 1.22-1.23.89l-4.24-2.23a.75.75 0 0 0-.7 0l-4.24 2.23c-.62.33-1.35-.2-1.23-.89l.81-4.72c.04-.23-.04-.46-.21-.62L2.48 10c-.5-.48-.22-1.33.47-1.43l4.75-.69c.23-.03.43-.17.53-.38l2.12-4.3A.74.74 0 0 1 12 2.75Z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-[#0F172A] font-medium">
                      {stats.rating > 0 ? `${stats.rating} (${stats.totalRatings} ratings)` : 'No ratings yet'}
                    </span>
                  </div>

                  <div className="text-xs text-[#64748B]">Member since {stats.memberSince}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-white rounded-xl p-4 text-center min-w-[120px] shadow-md" style={sideBottomShadow}>
                  <div className="text-2xl font-medium text-[#3B82F6] mb-1">{stats.totalDeliveries}</div>
                  <div className="text-xs text-[#64748B]">Total Deliveries</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center min-w-[120px] shadow-md" style={sideBottomShadow}>
                  <div className="text-2xl font-medium text-[#00D68F] mb-1">{stats.successRate}%</div>
                  <div className="text-xs text-[#64748B]">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
          </YummyText>

          <YummyText>
          <div className="flex items-center gap-2 mb-8 bg-gray-100 p-1 py-1 rounded-full w-fit">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-7 py-1 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'personal'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`px-7 py-1 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'vehicle'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Vehicle
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-7 py-1 rounded-full text-sm font-normal transition-colors ${
                activeTab === 'documents'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Documents
            </button>
          </div>

          {activeTab === 'personal' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
              <div className="mb-6">
                <div className="text-xl font-normal text-[#0A0A0A] mb-1">
                  Personal Information
                </div>
                <div className="text-sm text-[#64748B]">
                  Update your personal details
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="Marcus"
                      value={personalInfo.firstName}
                      onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Johnson"
                      value={personalInfo.lastName}
                      onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="marcus.j@email.com"
                    value={personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    value={personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Address</label>
                  <input
                    type="text"
                    placeholder="456 Rider Street, New York, NY 10001"
                    value={personalInfo.address}
                    onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Name and phone number"
                    value={personalInfo.emergencyContact}
                    onChange={(e) => handlePersonalInfoChange('emergencyContact', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#64748B] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                <button 
                  onClick={handleSavePersonalInfo}
                  disabled={saving}
                  className="bg-[#00B75A] hover:bg-[#00B876] font-[400] text-white px-6 py-3 rounded-xl transition-colors font-[300] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
              <div className="mb-6">
                <div className="text-xl font-normal text-[#0F172A] mb-1">
                  Vehicle Details
                </div>
                <div className="text-sm text-[#64748B]">
                  Information about your delivery vehicle
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Vehicle Type</label>
                    <input
                      type="text"
                      placeholder="Motorcycle"
                      value={vehicleInfo.type}
                      onChange={(e) => handleVehicleInfoChange('type', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Make & Model</label>
                    <input
                      type="text"
                      placeholder="Honda CBR 250R"
                      value={vehicleInfo.makeModel}
                      onChange={(e) => handleVehicleInfoChange('makeModel', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Year</label>
                    <input
                      type="text"
                      placeholder="2022"
                      value={vehicleInfo.year}
                      onChange={(e) => handleVehicleInfoChange('year', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Color</label>
                    <input
                      type="text"
                      placeholder="Red"
                      value={vehicleInfo.color}
                      onChange={(e) => handleVehicleInfoChange('color', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">License Plate</label>
                  <input
                    type="text"
                    placeholder="ABC-1234"
                    value={vehicleInfo.licensePlate}
                    onChange={(e) => handleVehicleInfoChange('licensePlate', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Insurance Policy Number</label>
                  <input
                    type="text"
                    placeholder="INS-9876543210"
                    value={vehicleInfo.insurancePolicy}
                    onChange={(e) => handleVehicleInfoChange('insurancePolicy', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                <button 
                  onClick={handleSaveVehicleInfo}
                  disabled={saving}
                  className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-xl transition-colors font-[400] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Vehicle Info'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <>
              <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100" style={sideBottomShadow}>
                <div className="mb-6">
                  <div className="text-xl font-normal text-[#0F172A] mb-1">
                    Required Documents
                  </div>
                  <div className="text-sm text-[#64748B]">
                    Keep your documents up to date
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DocumentIcon width={20} height={20} stroke="#00A63E" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#0F172A] mb-1">Driver's License</div>
                          <div className="text-xs text-[#64748B]">Expires: {documents.driversLicense.expires}</div>
                        </div>
                      </div>
                      <input
                        ref={driversLicenseInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentUpload('driversLicense', e)}
                        className="hidden"
                      />
                      <button 
                        onClick={() => driversLicenseInputRef.current?.click()}
                        className="flex items-center gap-2 text-sm py-1.5 px-4 rounded-lg text-[#0F172A] hover:text-[#00D68F] transition-colors w-fit" 
                        style={{border: "1px solid #0000001A"}}
                      >
                        <UploadIcon size={18} stroke="black" />
                        Update Document
                      </button>
                    </div>
                    <span className={`px-3 py-1 ${documents.driversLicense.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} rounded-full text-xs font-medium`}>
                      {documents.driversLicense.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DocumentIcon width={20} height={20} stroke="#00A63E" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#0F172A] mb-1">Vehicle Registration</div>
                          <div className="text-xs text-[#64748B]">Expires: {documents.vehicleRegistration.expires}</div>
                        </div>
                      </div>
                      <input
                        ref={vehicleRegistrationInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentUpload('vehicleRegistration', e)}
                        className="hidden"
                      />
                      <button 
                        onClick={() => vehicleRegistrationInputRef.current?.click()}
                        className="flex items-center py-1.5 px-4 rounded-lg gap-2 text-sm text-[#0F172A] hover:text-[#00D68F] transition-colors w-fit" 
                        style={{border: "1px solid #0000001A"}}
                      >
                        <UploadIcon size={18} stroke="black" />
                        Update Document
                      </button>
                    </div>
                    <span className={`px-3 py-1 ${documents.vehicleRegistration.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} rounded-full text-xs font-medium`}>
                      {documents.vehicleRegistration.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DocumentIcon width={20} height={20} stroke="#00A63E" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#0F172A] mb-1">Insurance Certificate</div>
                          <div className="text-xs text-[#64748B]">Expires: {documents.insuranceCertificate.expires}</div>
                        </div>
                      </div>
                      <input
                        ref={insuranceCertificateInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentUpload('insuranceCertificate', e)}
                        className="hidden"
                      />
                      <button 
                        onClick={() => insuranceCertificateInputRef.current?.click()}
                        className="flex items-center py-1.5 px-4 rounded-lg gap-2 text-sm text-[#0F172A] hover:text-[#00D68F] transition-colors w-fit" 
                        style={{border: "1px solid #0000001A"}}
                      >
                        <UploadIcon size={18} stroke="black" /> 
                        Update Document
                      </button>
                    </div>
                    <span className={`px-3 py-1 ${documents.insuranceCertificate.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} rounded-full text-xs font-medium`}>
                      {documents.insuranceCertificate.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DocumentIcon width={20} height={20} stroke="#D08700" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#0F172A] mb-1">Background Check</div>
                          <div className="text-xs text-[#64748B]">Last updated: {documents.backgroundCheck.lastUpdated}</div>
                        </div>
                      </div>
                      <input
                        ref={backgroundCheckInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentUpload('backgroundCheck', e)}
                        className="hidden"
                      />
                      <button 
                        onClick={() => backgroundCheckInputRef.current?.click()}
                        className="flex items-center gap-2 py-1.5 px-4 text-[#D08700] rounded-lg text-sm hover:bg-orange-50 transition-colors w-fit" 
                        style={{border: "1px solid #D08700"}}
                      >
                        <UploadIcon size={18} stroke="#D08700" />
                        Renew Now
                      </button>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      Renewal Due
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
                <div className="mb-6">
                  <div className="text-xl font-normal text-[#0F172A] mb-1">
                    Profile Completion
                  </div>
                  <div className="text-sm text-[#64748B]">
                    Complete your profile to unlock all features
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-[#64748B]">Profile Strength</div>
                    <div className={`text-sm font-medium ${completionColors.text}`}>
                      {completionPercentage}%
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${completionColors.bar}`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  {completionPercentage === 100 ? (
                    <div className="text-xs text-[#00D68F] mt-3 flex items-center gap-1">
                      <span>✓</span>
                      <span>Profile complete! All documents verified.</span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-[#0F172A] mb-2">
                        {completionPercentage <= 45 ? (
                          "Upload and verify these documents to improve your profile:"
                        ) : completionPercentage <= 75 ? (
                          "You're making progress! Complete these to reach 100%:"
                        ) : (
                          "Almost there! Just a few more documents:"
                        )}
                      </div>
                      <ul className="space-y-1">
                        {missingDocs.map((doc, index) => (
                          <li key={index} className="text-xs text-[#64748B] flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${completionPercentage <= 45 ? 'bg-[#0F172A]' : completionPercentage <= 75 ? 'bg-orange-500' : 'bg-[#00D68F]'}`}></span>
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          </YummyText>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
            color={toastMsg.includes('Failed') || toastMsg.includes('Error') ? 'danger' : 'success'}
          />
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default RiderProfile;