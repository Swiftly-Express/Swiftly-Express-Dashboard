import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import confetti from 'canvas-confetti';
import { 
  closeOutline, 
  informationCircleOutline
} from 'ionicons/icons';
import ForwardIcon from "../../../icons/Forwardicon";
import BackIcon from "../../../icons/Backicon";
import ShieldCheckIcon from '../../../icons/Shieldcheck';
import CheckCircleIcon from '../../../icons/Circlecheck';
import UploadIcon from "../../../icons/Uploadicon";
import { useIonRouter } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';
import { removeVerificationNotification } from '../../../utils/verificationNotifications';
import { submitRiderVerification, getRiderProfile } from '../../../utils/authApi';

const VerificationPromptModal = ({ isOpen, onClose }) => {
  const router = useIonRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Contact Information
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    // Identity
    idType: '',
    idNumber: '',
    idDocument: null,
    profilePhoto: null,
    // Vehicle
    vehicleType: '',
    makeModel: '',
    year: '',
    licensePlate: '',
    driversLicense: null,
    insurance: null,
    // Agreement
    agreeBackgroundCheck: false
  });

  // Trigger confetti when success modal shows
  useEffect(() => {
    if (showSuccessModal) {
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ['#00B876', '#00D68F', '#DCFCE7', '#FFD700', '#FF6B9D'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors
        });
      }, 200);
    }
  }, [showSuccessModal]);

  const steps = [
    { id: 1, name: 'Contact', active: true },
    { id: 2, name: 'Identity', active: false },
    { id: 3, name: 'Vehicle', active: false },
    { id: 4, name: 'Review', active: false }
  ];

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }

    console.log(`[VerificationPromptModal] File selected for ${field}:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });

    handleInputChange(field, file);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agreeBackgroundCheck) {
      alert('Please accept the background check authorization');
      return;
    }

    // Validate that all required files are present and are actual File objects
    if (!formData.idDocument || !(formData.idDocument instanceof File)) {
      alert('Please upload your ID document');
      return;
    }
    if (!formData.profilePhoto || !(formData.profilePhoto instanceof File)) {
      alert('Please upload your profile photo');
      return;
    }
    if (!formData.driversLicense || !(formData.driversLicense instanceof File)) {
      alert("Please upload your driver's license");
      return;
    }

    console.log('[VerificationPromptModal] Starting submission with files:', {
      idDocument: {
        name: formData.idDocument.name,
        size: formData.idDocument.size,
        type: formData.idDocument.type
      },
      profilePhoto: {
        name: formData.profilePhoto.name,
        size: formData.profilePhoto.size,
        type: formData.profilePhoto.type
      },
      driversLicense: {
        name: formData.driversLicense.name,
        size: formData.driversLicense.size,
        type: formData.driversLicense.type
      },
      insurance: formData.insurance ? {
        name: formData.insurance.name,
        size: formData.insurance.size,
        type: formData.insurance.type
      } : null
    });

    setUploading(true);

    try {
      // Create FormData object
      const submitData = new FormData();
      
      // Add contact information
      submitData.append('contactInfo[phone]', formData.phoneNumber || '');
      submitData.append('contactInfo[streetAddress]', formData.streetAddress || '');
      submitData.append('contactInfo[city]', formData.city || '');
      submitData.append('contactInfo[state]', formData.state || '');
      submitData.append('contactInfo[zipCode]', formData.zipCode || '');
      
      // Add identity information
      submitData.append('identity[idType]', formData.idType || '');
      submitData.append('identity[idNumber]', formData.idNumber || '');
      
      // Add vehicle information
      submitData.append('vehicle[type]', formData.vehicleType || '');
      submitData.append('vehicle[makeModel]', formData.makeModel || '');
      submitData.append('vehicle[year]', formData.year ? parseInt(formData.year) : '');
      submitData.append('vehicle[licensePlate]', formData.licensePlate || '');
      
      // Add background check consent
      submitData.append('backgroundCheckConsent', true);
      
      // Add files - CRITICAL: Use the File objects directly with explicit filenames
      submitData.append('idDocument', formData.idDocument, formData.idDocument.name);
      submitData.append('profilePhoto', formData.profilePhoto, formData.profilePhoto.name);
      submitData.append('driversLicense', formData.driversLicense, formData.driversLicense.name);
      
      if (formData.insurance && formData.insurance instanceof File) {
        submitData.append('insurance', formData.insurance, formData.insurance.name);
      }

      // Debug: Log all FormData entries
      console.log('[VerificationPromptModal] FormData contents:');
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      console.log('[VerificationPromptModal] Submitting to API...');

      // Submit to API
      const response = await submitRiderVerification(submitData);
      
      console.log('[VerificationPromptModal] Verification submitted successfully:', response);

      // Mark account as verified
      localStorage.setItem('riderAccountVerified', 'true');
      localStorage.setItem('accountVerifiedAt', new Date().toISOString());
      localStorage.setItem('verificationCompleted', 'true');
      
      // Remove verification notifications
      removeVerificationNotification();
      
      // Clear verification prompt data
      localStorage.removeItem('verificationPromptDismissedAt');
      localStorage.removeItem('nextVerificationPushNotification');
      localStorage.removeItem('lastVerificationPushNotification');

      // Refresh profile
      try {
        const profileResponse = await getRiderProfile();
        console.log('[VerificationPromptModal] Profile refreshed:', profileResponse);
        
        window.dispatchEvent(new CustomEvent('verification:completed', { 
          detail: { profile: profileResponse?.data || profileResponse } 
        }));
      } catch (profileError) {
        console.error('[VerificationPromptModal] Failed to refresh profile:', profileError);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('[VerificationPromptModal] Verification failed:', error);
      alert(error.message || 'Failed to submit documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('verificationPromptDismissedAt', new Date().toISOString());
    setCurrentStep(1);
    setFormData({
      phoneNumber: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      idType: '',
      idNumber: '',
      idDocument: null,
      profilePhoto: null,
      vehicleType: '',
      makeModel: '',
      year: '',
      licensePlate: '',
      driversLicense: null,
      insurance: null,
      agreeBackgroundCheck: false
    });
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  const getStepColor = (stepId) => {
    if (stepId < currentStep) return 'text-[#00D68F]';
    if (stepId === currentStep) return 'text-[#00D68F]';
    return 'text-gray-400';
  };

  const getProgressWidth = () => {
    return `${((currentStep - 1) / 3) * 100}%`;
  };

  const isStep1Valid = () => {
    return formData.phoneNumber.trim() !== '' &&
           formData.streetAddress.trim() !== '' &&
           formData.city.trim() !== '' &&
           formData.state.trim() !== '' &&
           formData.zipCode.trim() !== '';
  };

  const isStep2Valid = () => {
    return formData.idType !== '' &&
           formData.idNumber.trim() !== '' &&
           formData.idDocument !== null &&
           formData.profilePhoto !== null;
  };

  const isStep3Valid = () => {
    return formData.vehicleType !== '' &&
           formData.makeModel.trim() !== '' &&
           formData.year.trim() !== '' &&
           formData.licensePlate.trim() !== '' &&
           formData.driversLicense !== null;
  };

  const isCurrentStepValid = () => {
    switch(currentStep) {
      case 1: return isStep1Valid();
      case 2: return isStep2Valid();
      case 3: return isStep3Valid();
      case 4: return formData.agreeBackgroundCheck;
      default: return false;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        style={{ backdropFilter: 'blur(8px)' }}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-20"
        >
          <IonIcon icon={closeOutline} className="text-gray-600 text-xl" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          <div className="p-8 pb-6">
            <div className="text-center mb-6">
              <YummyText>
                <h1 className="text-3xl font-bold text-[#00B75A] mb-2">Swiftly</h1>
                <h2 className="text-3xl font-sm text-[#0A0A0A] mb-0">Verify Your Account</h2>
                <p className="text-[#717182] text-xs font-[400]">Complete your rider profile to start delivering</p>
              </YummyText>
            </div>

            <div className="flex items-center justify-center gap-1 mb-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <YummyText>
                    <span className={`text-xs font-[300] ${getStepColor(step.id)}`}>
                      {step.name}
                    </span>
                  </YummyText>
                  {index < steps.length - 1 && (
                    <span className="text-gray-300 mx-1">›</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#00D68F] transition-all duration-300"
                style={{ width: getProgressWidth() }}
              />
            </div>
          </div>

          <div className="px-6 pb-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <YummyText>
                  <div>
                    <h3 className="text-medium font-[400] text-[#0F172A] mb-1">Contact Information</h3>
                    <p className="text-xs text-[#4A5565] mb-4">We need your contact details to reach you and verify your location.</p>
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-2 flex gap-2">
                    <IonIcon icon={informationCircleOutline} className="text-[#1E40AF] text-lg flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1E40AF]">All information is encrypted and securely stored.</p>
                  </div>

                  <div> 
                    <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-5">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+234 908 767 4240"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F3F3F5] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">Street Address *</label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F3F3F5] border-none placeholder:text-[#717182] rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">City *</label>
                      <input
                        type="text"
                        placeholder="Uyo"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F3F3F5] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">State *</label>
                      <input
                        type="text"
                        placeholder="Akwa Ibom"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F3F3F5] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">ZIP Code *</label>
                      <input
                        type="text"
                        placeholder="10001"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F3F3F5] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                  </div>
                </YummyText>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <YummyText>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">Identity Verification</h3>
                    <p className="text-sm text-[#64748B] mb-4">Upload your government-issued ID and a recent photo for verification.</p>
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 flex gap-2">
                    <IonIcon icon={informationCircleOutline} className="text-[#3B82F6] text-xl flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1E40AF]">Accepted formats: JPG, PNG, PDF. Max file size: 10MB.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-5">ID Type *</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => handleInputChange('idType', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F3F3F5] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none appearance-none"
                    >
                      <option value="">Select ID type</option>
                      <option value="drivers-license">Driver's License</option>
                      <option value="passport">International Passport</option>
                      <option value="national-id">National ID Card</option>
                      <option value="voters-card">Voter's Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">ID Number *</label>
                    <input
                      type="text"
                      placeholder="Input ID number"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F3F3F5] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">Upload ID Document *</label>
                      <label className="flex items-center gap-2 px-4 py-3 bg-[#F3F3F5] border-none rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-[#717182] flex-1 truncate">
                          {formData.idDocument ? formData.idDocument.name : 'Select a file'}
                        </span>
                        <UploadIcon size={16} stroke="#717182" />
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload('idDocument', e)}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">Profile Photo *</label>
                      <label className="flex items-center gap-2 px-4 py-3 bg-[#F3F3F5] border-none rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-[#717182] flex-1 truncate">
                          {formData.profilePhoto ? formData.profilePhoto.name : 'Select a file'}
                        </span>
                        <UploadIcon size={16} stroke="#717182" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('profilePhoto', e)}
                        />
                      </label>
                    </div>
                  </div>
                </YummyText>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <YummyText>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">Vehicle Information</h3>
                    <p className="text-sm text-[#64748B] mb-4">Tell us about your vehicle and provide your driver's license.</p>
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 flex gap-2">
                    <IonIcon icon={informationCircleOutline} className="text-[#3B82F6] text-xl flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1E40AF]">Your vehicle must be in good working condition and meet local requirements.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-5">Vehicle Type *</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                      className="w-full px-4 py-3 placeholder:text-[#717182] bg-[#F8F9FA] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none appearance-none"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="scooter">Scooter</option>
                      <option value="bicycle">Bicycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">Make/Model *</label>
                      <input
                        type="text"
                        placeholder="Honda Civic"
                        value={formData.makeModel}
                        onChange={(e) => handleInputChange('makeModel', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F8F9FA] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">Year *</label>
                      <input
                        type="text"
                        placeholder="2020"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">License Plate *</label>
                    <input
                      type="text"
                      placeholder="ABC-1234"
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] placeholder:text-[#717182] border-none rounded-lg focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">Driver's License *</label>
                      <label className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FA] border-none rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-[#717182] flex-1 truncate">
                          {formData.driversLicense ? formData.driversLicense.name : "Select a file"}
                        </span>
                        <UploadIcon size={16} stroke="#717182" />
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload('driversLicense', e)}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2 mt-3">Insurance (Optional)</label>
                      <label className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FA] border-none rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <span className="text-sm text-[#717182] flex-1 truncate">
                          {formData.insurance ? formData.insurance.name : 'Select a file'}
                        </span>
                        <UploadIcon size={16} stroke="#717182" />
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload('insurance', e)}
                        />
                      </label>
                    </div>
                  </div>
                </YummyText>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <YummyText>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">Review & Submit</h3>
                    <p className="text-sm text-[#64748B] mb-4">Please review your information and accept the background check authorization.</p>
                  </div>

                  <div className="bg-[#F8F9FA] rounded-xl p-4 divide-y divide-gray-300">
                    <div className="pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-[#0F172A]">Contact</h4>
                        <button onClick={() => setCurrentStep(1)} className="text-sm text-[#00D68F] hover:text-[#00B876] font-medium">Edit</button>
                      </div>
                      <p className="text-sm text-[#64748B]">{formData.phoneNumber || 'Not provided'}</p>
                      <p className="text-sm text-[#64748B]">{formData.streetAddress || 'Not provided'}, {formData.city || 'Not provided'}, {formData.state || 'Not provided'}</p>
                    </div>

                    <div className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-[#0F172A]">Identity</h4>
                        <button onClick={() => setCurrentStep(2)} className="text-sm text-[#00D68F] hover:text-[#00B876] font-medium">Edit</button>
                      </div>
                      <p className="text-sm text-[#64748B]">{formData.idType || 'Not provided'}</p>
                      <p className="text-sm text-[#64748B]">ID: {formData.idNumber || 'Not provided'}</p>
                    </div>

                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-[#0F172A]">Vehicle</h4>
                        <button onClick={() => setCurrentStep(3)} className="text-sm text-[#00D68F] hover:text-[#00B876] font-medium">Edit</button>
                      </div>
                      <p className="text-sm text-[#64748B]">{formData.vehicleType || 'Not provided'} - {formData.makeModel || 'Not provided'} ({formData.year || 'Not provided'})</p>
                      <p className="text-sm text-[#64748B]">Plate: {formData.licensePlate || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="bg-[#EDFFEE] border border-[#A7FFB3] rounded-lg p-3 mb-2 mt-4 flex gap-2">
                    <ShieldCheckIcon width={20} height={20} color="#059F00" />
                    <p className="text-xs text-[#059F00]">By submitting this application, you authorize Swiftly Express to conduct background checks and verify your information.</p>
                  </div>

                  <label className="flex items-start gap-2 p-3 rounded-lg bg-[#EFF6FF] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeBackgroundCheck}
                      onChange={(e) => handleInputChange('agreeBackgroundCheck', e.target.checked)}
                      className="mt-1 w-3 h-3 text-[#00D68F] border border-[#BEDBFF] rounded focus:ring-[#00D68F]"
                    />
                    <span className="text-xs text-[#64748B]">
                      I authorize Swiftly Express to conduct a background check and verify my driving record. I understand this is required for platform safety and I certify that all information provided is accurate.
                    </span>
                  </label>
                </YummyText>
              </div>
            )}

            <YummyText>
              <div className="flex gap-3 mt-8">
                {currentStep > 1 ? (
                  <button
                    onClick={prevStep}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                    style={{border: "1px solid #0000001A"}}
                  >
                    <BackIcon size={18} color="#0A0A0A" />
                    <span className="font-medium text-[#0A0A0A]">Back</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-[#0A0A0A]" 
                    style={{border: "1px solid #0000001A"}}
                  >
                    Cancel
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!isCurrentStepValid()}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#00D68F] text-white rounded-xl transition-colors font-medium ${
                      isCurrentStepValid() ? 'hover:bg-[#00B876] opacity-100' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue</span>
                    <ForwardIcon size={18} color="#FFFFFF" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.agreeBackgroundCheck || uploading}
                    className={`flex-1 px-6 py-3 rounded-xl transition-colors font-medium ${
                      formData.agreeBackgroundCheck && !uploading
                        ? 'bg-[#00D68F] hover:bg-[#00B876] text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {uploading ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                )}
              </div>
            </YummyText>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scale-in">
            <YummyText>
              <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon width={32} height={32} color="#00B876" />
              </div>
              <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-3">Application Submitted!</h2>
              <div className="bg-[#EFF6FF] rounded-xl p-4 mb-4">
                <p className="text-sm flex text-justify leading-relaxed text-[#64748B] mb-3">
                  <IonIcon icon={informationCircleOutline} className="text-[#3B82F6] text-lg flex-shrink-0 mt-0.5 mr-2" />
                  Your application is under review. Our team will verify your documents and conduct necessary background checks.
                </p>
                <p className="text-sm font-[700] text-[#1447E6]">
                  <img src="/clockicon.svg" alt="Clock Icon" className="inline-block w-4 h-4 mr-3" />
                  <span className="text-sm font-[300] text-[#1447E6]">Expected review time:</span> 2-5 business days
                </p>
              </div>
              <p className="text-xs text-[#4A5565] mb-6">
                We'll notify you via email once your account has been approved. You can then start accepting deliveries and earning!
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose();
                  window.location.reload();
                }}
                className="w-full py-3 bg-[#00B75A] hover:bg-[#00B876] text-white text-sm rounded-xl transition-colors font-medium"
              >
                Go to Dashboard
              </button>
              <p className="text-xs text-[#6A7282] mt-3">You'll receive an email confirmation shortly</p>
            </YummyText>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VerificationPromptModal;