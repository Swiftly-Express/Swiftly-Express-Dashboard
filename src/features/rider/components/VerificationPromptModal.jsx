import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { 
  closeOutline, 
  shieldCheckmarkOutline,
  checkmarkCircle,
  documentTextOutline,
  carOutline,
  cardOutline,
  arrowBackOutline,
  informationCircleOutline,
  cloudUploadOutline
} from 'ionicons/icons';
import { useIonRouter } from '@ionic/react';
import { YummyText } from '../../../components/YummyText';
import { removeVerificationNotification } from '../../../utils/verificationNotifications';

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

    setUploading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mark account as verified
      localStorage.setItem('riderAccountVerified', 'true');
      localStorage.setItem('accountVerifiedAt', new Date().toISOString());
      
      // Remove verification notifications
      removeVerificationNotification();
      
      // Clear verification prompt data
      localStorage.removeItem('verificationPromptDismissedAt');
      localStorage.removeItem('nextVerificationPushNotification');
      localStorage.removeItem('lastVerificationPushNotification');

      setShowSuccessModal(true);
    } catch (error) {
      alert('Failed to submit documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('verificationPromptDismissedAt', new Date().toISOString());
    setCurrentStep(1); // Reset to first step
    setFormData({ // Clear form data
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Glassmorphism Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        style={{ backdropFilter: 'blur(8px)' }}
      />

      {/* Modal Content - Using VerifyAccount.jsx design */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-20"
        >
          <IonIcon icon={closeOutline} className="text-gray-600 text-xl" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="p-8 pb-6">
            <div className="text-center mb-6">
              <YummyText>
                <h1 className="text-2xl font-semibold text-[#00D68F] mb-2">Swiftly</h1>
                <h2 className="text-2xl font-semibold text-[#0F172A] mb-1">Verify Your Account</h2>
                <p className="text-[#64748B] text-sm">Complete your rider profile to start delivering</p>
              </YummyText>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <YummyText>
                    <span className={`text-sm font-medium ${getStepColor(step.id)}`}>
                      {step.name}
                    </span>
                  </YummyText>
                  {index < steps.length - 1 && (
                    <span className="text-gray-300 mx-1">›</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#00D68F] transition-all duration-300"
                style={{ width: getProgressWidth() }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {/* Step 1: Contact Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <YummyText>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">Contact Information</h3>
                    <p className="text-sm text-[#64748B] mb-4">We need your contact details to reach you and verify your location.</p>
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 flex gap-2">
                    <IonIcon icon={informationCircleOutline} className="text-[#3B82F6] text-xl flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1E40AF]">All information is encrypted and securely stored.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+234 908 767 4240"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">Street Address *</label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">City *</label>
                      <input
                        type="text"
                        placeholder="Uyo"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">State *</label>
                      <input
                        type="text"
                        placeholder="Akwa Ibom"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">ZIP Code *</label>
                      <input
                        type="text"
                        placeholder="10001"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                  </div>
                </YummyText>
              </div>
            )}

            {/* Step 2: Identity Verification */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <YummyText>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">Identity Verification</h3>
                    <p className="text-sm text-[#64748B] mb-4">Upload your government-issued ID and a recent photo for verification.</p>
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 flex gap-2">
                    <IonIcon icon={informationCircleOutline} className="text-[#3B82F6] text-xl flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1E40AF]">Accepted formats: JPG, PNG, PDF. Max file size: 5MB.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">ID Type *</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => handleInputChange('idType', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none appearance-none"
                    >
                      <option value="">Select ID type</option>
                      <option value="drivers-license">Driver's License</option>
                      <option value="passport">International Passport</option>
                      <option value="national-id">National ID Card</option>
                      <option value="voters-card">Voter's Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">ID Number *</label>
                    <input
                      type="text"
                      placeholder="Input ID number"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Upload ID Document *</label>
                      <label className="flex items-center justify-center gap-2 px-4 py-8 bg-[#F8F9FA] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <IonIcon icon={cloudUploadOutline} className="text-gray-400 text-2xl" />
                        <span className="text-sm text-gray-600">
                          {formData.idDocument ? formData.idDocument.name : 'Select a file'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload('idDocument', e)}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Profile Photo *</label>
                      <label className="flex items-center justify-center gap-2 px-4 py-8 bg-[#F8F9FA] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <IonIcon icon={cloudUploadOutline} className="text-gray-400 text-2xl" />
                        <span className="text-sm text-gray-600">
                          {formData.profilePhoto ? formData.profilePhoto.name : 'Select a file'}
                        </span>
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

            {/* Step 3: Vehicle Information */}
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
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">Vehicle Type *</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none appearance-none"
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
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Make/Model *</label>
                      <input
                        type="text"
                        placeholder="Honda Civic"
                        value={formData.makeModel}
                        onChange={(e) => handleInputChange('makeModel', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Year *</label>
                      <input
                        type="text"
                        placeholder="2020"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">License Plate *</label>
                    <input
                      type="text"
                      placeholder="ABC-1234"
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:ring-2 focus:ring-[#00D68F] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Driver's License *</label>
                      <label className="flex items-center justify-center gap-2 px-4 py-8 bg-[#F8F9FA] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <IonIcon icon={cloudUploadOutline} className="text-gray-400 text-2xl" />
                        <span className="text-sm text-gray-600">
                          {formData.driversLicense ? formData.driversLicense.name : 'Select a file'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload('driversLicense', e)}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F172A] mb-2">Insurance (Optional)</label>
                      <label className="flex items-center justify-center gap-2 px-4 py-8 bg-[#F8F9FA] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <IonIcon icon={cloudUploadOutline} className="text-gray-400 text-2xl" />
                        <span className="text-sm text-gray-600">
                          {formData.insurance ? formData.insurance.name : 'Select a file'}
                        </span>
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

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <YummyText>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-1">Review & Submit</h3>
                    <p className="text-sm text-[#64748B] mb-4">Please review your information and accept the background check authorization.</p>
                  </div>

                  {/* Contact Summary */}
                  <div className="bg-[#F8F9FA] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#0F172A]">Contact</h4>
                      <button onClick={() => setCurrentStep(1)} className="text-sm text-[#00D68F] hover:text-[#00B876] font-medium">Edit</button>
                    </div>
                    <p className="text-sm text-[#64748B]">{formData.phoneNumber || 'Not provided'}</p>
                    <p className="text-sm text-[#64748B]">{formData.streetAddress || 'Not provided'}, {formData.city || 'Not provided'}, {formData.state || 'Not provided'}</p>
                  </div>

                  {/* Identity Summary */}
                  <div className="bg-[#F8F9FA] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#0F172A]">Identity</h4>
                      <button onClick={() => setCurrentStep(2)} className="text-sm text-[#00D68F] hover:text-[#00B876] font-medium">Edit</button>
                    </div>
                    <p className="text-sm text-[#64748B]">{formData.idType || 'Not provided'}</p>
                    <p className="text-sm text-[#64748B]">ID: {formData.idNumber || 'Not provided'}</p>
                  </div>

                  {/* Vehicle Summary */}
                  <div className="bg-[#F8F9FA] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#0F172A]">Vehicle</h4>
                      <button onClick={() => setCurrentStep(3)} className="text-sm text-[#00D68F] hover:text-[#00B876] font-medium">Edit</button>
                    </div>
                    <p className="text-sm text-[#64748B]">{formData.vehicleType || 'Not provided'} - {formData.makeModel || 'Not provided'} ({formData.year || 'Not provided'})</p>
                    <p className="text-sm text-[#64748B]">Plate: {formData.licensePlate || 'Not provided'}</p>
                  </div>

                  {/* Background Check Notice */}
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex gap-2">
                    <IonIcon icon={checkmarkCircle} className="text-[#00D68F] text-xl flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#065F46]">By submitting this application, you authorize Swiftly Express to conduct background checks and verify your information.</p>
                  </div>

                  {/* Agreement Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeBackgroundCheck}
                      onChange={(e) => handleInputChange('agreeBackgroundCheck', e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#00D68F] border-gray-300 rounded focus:ring-[#00D68F]"
                    />
                    <span className="text-sm text-[#64748B]">
                      I authorize Swiftly Express to conduct a background check and verify my driving record. I understand this is required for platform safety and I certify that all information provided is accurate. *
                    </span>
                  </label>
                </YummyText>
              </div>
            )}

            {/* Action Buttons */}
            <YummyText>
              <div className="flex gap-3 mt-8">
                {currentStep > 1 ? (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <IonIcon icon={arrowBackOutline} className="text-gray-600" />
                    <span className="font-medium text-[#64748B]">Back</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDismiss}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-[#64748B]"
                  >
                    Cancel
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#00D68F] hover:bg-[#00B876] text-white rounded-xl transition-colors font-medium"
                  >
                    <span>Continue</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scale-in">
            <YummyText>
              <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
                <IonIcon icon={checkmarkCircle} className="text-[#00D68F] text-5xl" />
              </div>
              <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">Application Submitted!</h2>
              <div className="bg-[#EFF6FF] rounded-xl p-4 mb-4">
                <p className="text-sm text-[#64748B] mb-3">
                  Your application is under review. Our team will verify your documents and conduct necessary background checks.
                </p>
                <p className="text-sm font-medium text-[#3B82F6]">Expected review time: 2-5 business days</p>
              </div>
              <p className="text-sm text-[#64748B] mb-6">
                We'll notify you via email once your account has been approved. You can then start accepting deliveries and earning!
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose();
                  window.location.reload();
                }}
                className="w-full py-3 bg-[#00D68F] hover:bg-[#00B876] text-white rounded-xl transition-colors font-medium"
              >
                Go to Dashboard
              </button>
              <p className="text-xs text-[#94A3B8] mt-3">You'll receive an email confirmation shortly</p>
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
