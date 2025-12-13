import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';
import DocumentIcon from "../../../icons/Documenticon";
import UploadIcon from "../../../icons/Uploadicon";
import { getRiderProfile, updateRiderProfile, uploadRiderProfileImage } from '../../../utils/authApi';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const RiderProfile = () => {
  // Get initial tab from sessionStorage or default to 'personal'
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('riderProfileTab') || 'personal';
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userName, setUserName] = useState(() => {
    // Initialize from localStorage immediately
    const cachedUserData = localStorage.getItem('user_data');
    if (cachedUserData) {
      try {
        const user = JSON.parse(cachedUserData);
        const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || 'Rider';
      } catch (e) {
        return 'Rider';
      }
    }
    return 'Rider';
  });
  const [riderId, setRiderId] = useState(() => {
    // Initialize from localStorage immediately
    const cachedUserData = localStorage.getItem('user_data');
    if (cachedUserData) {
      try {
        const user = JSON.parse(cachedUserData);
        return user.riderId || user.driverId || (user.id ? `RD-${user.id}` : '');
      } catch (e) {
        return '';
      }
    }
    return '';
  });
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('profile_image') || '/profileimage.svg';
  });
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const [documents, setDocuments] = useState({
    driversLicense: { uploaded: true, verified: true, expires: 'Dec 15, 2026' },
    vehicleRegistration: { uploaded: true, verified: true, expires: 'Aug 20, 2025' },
    insuranceCertificate: { uploaded: true, verified: true, expires: 'Nov 30, 2025' },
    backgroundCheck: { uploaded: true, verified: false, lastUpdated: '6 months ago' }
  });

  // File input refs
  const profileImageInputRef = useRef(null);
  const driversLicenseInputRef = useRef(null);
  const vehicleRegistrationInputRef = useRef(null);
  const insuranceCertificateInputRef = useRef(null);
  const backgroundCheckInputRef = useRef(null);

  // Save active tab to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('riderProfileTab', activeTab);
  }, [activeTab]);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
    
    // Listen for verification completion event
    const handleVerificationComplete = (event) => {
      console.log('[Profile] Verification completed, refreshing profile');
      fetchProfile();
    };
    
    window.addEventListener('verification:completed', handleVerificationComplete);
    
    return () => {
      window.removeEventListener('verification:completed', handleVerificationComplete);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Load cached profile image immediately
      const cachedImage = localStorage.getItem('profile_image');
      if (cachedImage) {
        setProfileImage(cachedImage);
      }
      
      // Load cached user data immediately
      const cachedUserData = localStorage.getItem('user_data');
      if (cachedUserData) {
        try {
          const user = JSON.parse(cachedUserData);
          const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
          if (name) setUserName(name);
          if (user.riderId || user.driverId || user.id) {
            setRiderId(user.riderId || user.driverId || `RD-${user.id}`);
          }
        } catch (e) {
          console.error('[Profile] Failed to parse cached user data:', e);
        }
      }
      
      const response = await getRiderProfile();
      const profile = response?.data?.driver || response?.driver || response?.data;
      setProfileData(profile);
      
      // Update profile image if available from API
      if (profile?.profilePhoto) {
        setProfileImage(profile.profilePhoto);
        localStorage.setItem('profile_image', profile.profilePhoto);
      }
      
      // Update user name from API
      if (profile) {
        const name = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (name) {
          setUserName(name);
        }
        
        // Update rider ID
        if (profile.riderId || profile.driverId || profile.id) {
          setRiderId(profile.riderId || profile.driverId || `RD-${profile.id}`);
        }
      }
      
      // Update documents status from API
      if (profile?.documents) {
        setDocuments(prev => ({
          ...prev,
          ...profile.documents
        }));
      }
      
      // Update verification status
      if (profile?.verificationStatus) {
        localStorage.setItem('riderVerificationStatus', profile.verificationStatus);
      }
      
      console.log('[Profile] Profile loaded:', profile);
    } catch (error) {
      console.error('[Profile] Error fetching profile:', error);
      
      // Handle 403 Forbidden specifically
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

  // Handle profile image upload
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setToastMsg('Please upload a JPG, PNG, or GIF image');
      setShowToast(true);
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToastMsg('File size must be less than 5MB');
      setShowToast(true);
      return;
    }

    // Show immediate preview while uploading
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result;
      setProfileImage(previewUrl);
      // Dispatch event immediately for instant UI update
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { profileImage: previewUrl }
      }));
      console.log('[Profile] Dispatched immediate preview event');
    };
    reader.readAsDataURL(file);

    setUploading(true);
    
    try {
      console.log('[Profile] Uploading profile image...');
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await uploadRiderProfileImage(formData);
      console.log('[Profile] Upload response:', response);
      
      // Update profile image with multiple fallback paths
      const imageUrl = response?.imageUrl || response?.data?.imageUrl || response?.url || response?.data?.url || response?.data?.driver?.profilePhoto || response?.driver?.profilePhoto;
      
      if (imageUrl) {
        setProfileImage(imageUrl);
        // Persist to localStorage
        localStorage.setItem('profile_image', imageUrl);
        console.log('[Profile] Saved profile image to localStorage:', imageUrl);
        
        // Dispatch event to notify other components (like RiderLayout)
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: { profileImage: imageUrl }
        }));
        console.log('[Profile] Dispatched profile:updated event for image');
        
        setToastMsg('Profile photo updated successfully!');
      } else {
        // Fallback to FileReader preview
        console.log('[Profile] No URL returned, using local preview');
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result);
          localStorage.setItem('profile_image', reader.result);
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

  // Handle document upload
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

      // Update document status
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

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const totalFields = 4; // 4 required documents
    let completed = 0;
    
    Object.values(documents).forEach(doc => {
      if (doc.uploaded && doc.verified) completed++;
    });

    return Math.round((completed / totalFields) * 100);
  };

  // Get completion color based on percentage
  const getCompletionColor = (percentage) => {
    if (percentage >= 0 && percentage <= 45) {
      return { bar: 'bg-[#0F172A]', text: 'text-[#0F172A]' }; // Black
    } else if (percentage >= 46 && percentage <= 75) {
      return { bar: 'bg-orange-500', text: 'text-orange-600' }; // Orange
    } else {
      return { bar: 'bg-[#00D68F]', text: 'text-[#00D68F]' }; // Green
    }
  };

  // Get missing documents
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

  // Show loading state
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
          {/* Header */}
          <YummyText>
          <div className="mb-4 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Rider Profile
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Manage your profile and documents
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-6 mb-8" style={sideBottomShadow}>
            <div className="flex items-start justify-between">
              {/* Left: Profile Info */}
              <div className="flex items-start gap-4">
                {/* Avatar with Edit Button */}
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

                {/* Profile Details */}
                <div>
                  <div className="text-xl font-medium text-[#0F172A] mb-1">{userName}</div>
                  <div className="text-sm text-[#64748B] mb-3">{riderId ? `Rider ID: ${riderId}` : 'Rider'}</div>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active Rider
                    </span>
                    <span className="px-3 py-1 bg-[#00D68F] text-white rounded-full text-xs font-medium">
                      Top Performer
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      500+ Deliveries
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          width="22" 
                          height="22" 
                          viewBox="0 0 24 24" 
                          fill="#00D68F" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2.75c.28 0 .53.16.65.41l2.12 4.3c.1.21.3.35.53.38l4.75.69c.69.1.97.95.47 1.43l-3.44 3.35c-.17.16-.25.39-.21.62l.81 4.72c.12.69-.61 1.22-1.23.89l-4.24-2.23a.75.75 0 0 0-.7 0l-4.24 2.23c-.62.33-1.35-.2-1.23-.89l.81-4.72c.04-.23-.04-.46-.21-.62L2.48 10c-.5-.48-.22-1.33.47-1.43l4.75-.69c.23-.03.43-.17.53-.38l2.12-4.3A.74.74 0 0 1 12 2.75Z"/>
                        </svg>

                      ))}
                    </div>
                    <span className="text-sm text-[#0F172A] font-medium">4.95 (238 ratings)</span>
                  </div>

                  <div className="text-xs text-[#64748B]">Member since March 2024</div>
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex gap-4">
                <div className="bg-white rounded-xl p-4 text-center min-w-[120px] shadow-md" style={sideBottomShadow}>
                  <div className="text-2xl font-medium text-[#3B82F6] mb-1">542</div>
                  <div className="text-xs text-[#64748B]">Total Deliveries</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center min-w-[120px] shadow-md" style={sideBottomShadow}>
                  <div className="text-2xl font-medium text-[#00D68F] mb-1">98%</div>
                  <div className="text-xs text-[#64748B]">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
          </YummyText>

          {/* Tab Navigation */}
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

          {/* Personal Info Tab */}
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
                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="Marcus"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Johnson"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="marcus.j@email.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Address</label>
                  <input
                    type="text"
                    placeholder="456 Rider Street, New York, NY 10001"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder:text-[#717182] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Name and phone number"
                    className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#64748B] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Save Button */}
                <button className="bg-[#00B75A] hover:bg-[#00B876] font-[400] text-white px-6 py-3 rounded-xl transition-colors font-[300]">
                  Save Changes
                </button>
              </div>
            </div>
  
          )}
          </YummyText>

          {/* Vehicle Tab */}
          <YummyText>
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
                {/* Vehicle Type & Make/Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Vehicle Type</label>
                    <input
                      type="text"
                      placeholder="Motorcycle"
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Make & Model</label>
                    <input
                      type="text"
                      placeholder="Honda CBR 250R"
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                {/* Year & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Year</label>
                    <input
                      type="text"
                      placeholder="2022"
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Color</label>
                    <input
                      type="text"
                      placeholder="Red"
                      className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                {/* License Plate */}
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">License Plate</label>
                  <input
                    type="text"
                    placeholder="ABC-1234"
                    className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Insurance Policy Number */}
                <div>
                  <label className="block text-sm font-medium text-[#0A0A0A] mb-2">Insurance Policy Number</label>
                  <input
                    type="text"
                    placeholder="INS-9876543210"
                    className="w-full px-4 py-3 bg-gray-50 placeholder:text-[#717182] border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Save Button */}
                <button className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-xl transition-colors font-[400]">
                  Update Vehicle Info
                </button>
              </div>
            </div>
          )}

          {/* Documents Tab */}
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
                  {/* Driver's License */}
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

                  {/* Vehicle Registration */}
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

                  {/* Insurance Certificate */}
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

                  {/* Background Check */}
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

              {/* Profile Completion */}
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

          {/* Toast Notification */}
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