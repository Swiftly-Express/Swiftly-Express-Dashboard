import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const RiderProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Rider Profile
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Manage your profile and documents
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDFFF9] rounded-2xl p-6 mb-8 border border-gray-100" style={sideBottomShadow}>
            <div className="flex items-start justify-between">
              {/* Left: Profile Info */}
              <div className="flex items-start gap-4">
                {/* Avatar with Edit Button */}
                <div className="relative">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"
                    alt="Marcus Johnson"
                    className="w-24 h-24 rounded-full bg-gray-200 object-cover"
                  />
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#00D68F] rounded-full flex items-center justify-center hover:bg-[#00B876] transition-colors">
                    <img src="/icons/camera.svg" alt="Edit" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1)' }} />
                  </button>
                </div>

                {/* Profile Details */}
                <div>
                  <div className="text-xl font-medium text-[#0F172A] mb-1">Marcus Johnson</div>
                  <div className="text-sm text-[#64748B] mb-3">Rider ID: RD-78945</div>
                  
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
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="#00D68F" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
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
                <div className="bg-white rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-2xl font-medium text-[#3B82F6] mb-1">542</div>
                  <div className="text-xs text-[#64748B]">Total Deliveries</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-2xl font-medium text-[#00D68F] mb-1">98%</div>
                  <div className="text-xs text-[#64748B]">Success Rate</div>
                </div>
              </div>
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
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`px-6 py-2 rounded-lg text-sm font-normal transition-colors ${
                activeTab === 'vehicle'
                  ? 'text-[#0F172A] bg-white shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Vehicle
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-6 py-2 rounded-lg text-sm font-normal transition-colors ${
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
                <div className="text-xl font-normal text-[#0F172A] mb-1">
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
                    <label className="block text-sm text-[#64748B] mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue="Marcus"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Johnson"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="marcus.j@email.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 234-5678"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Address</label>
                  <input
                    type="text"
                    defaultValue="456 Rider Street, New York, NY 10001"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Name and phone number"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#64748B] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Save Button */}
                <button className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-xl transition-colors font-[300]">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Vehicle Tab */}
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
                    <label className="block text-sm text-[#64748B] mb-2">Vehicle Type</label>
                    <input
                      type="text"
                      defaultValue="Motorcycle"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Make & Model</label>
                    <input
                      type="text"
                      defaultValue="Honda CBR 250R"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                {/* Year & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Year</label>
                    <input
                      type="text"
                      defaultValue="2022"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Color</label>
                    <input
                      type="text"
                      defaultValue="Red"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                {/* License Plate */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">License Plate</label>
                  <input
                    type="text"
                    defaultValue="ABC-1234"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Insurance Policy Number */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Insurance Policy Number</label>
                  <input
                    type="text"
                    defaultValue="INS-9876543210"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Save Button */}
                <button className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-xl transition-colors font-[300]">
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
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#00D68F"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#0F172A] mb-1">Driver's License</div>
                        <div className="text-xs text-[#64748B] mb-3">Expires: Dec 15, 2026</div>
                        <button className="flex items-center gap-2 text-sm text-[#0F172A] hover:text-[#00D68F] transition-colors">
                          <img src="/icons/upload.svg" alt="Upload" className="w-4 h-4" />
                          Update Document
                        </button>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Verified
                    </span>
                  </div>

                  {/* Vehicle Registration */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#00D68F"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#0F172A] mb-1">Vehicle Registration</div>
                        <div className="text-xs text-[#64748B] mb-3">Expires: Aug 20, 2025</div>
                        <button className="flex items-center gap-2 text-sm text-[#0F172A] hover:text-[#00D68F] transition-colors">
                          <img src="/icons/upload.svg" alt="Upload" className="w-4 h-4" />
                          Update Document
                        </button>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Verified
                    </span>
                  </div>

                  {/* Insurance Certificate */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#00D68F"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#0F172A] mb-1">Insurance Certificate</div>
                        <div className="text-xs text-[#64748B] mb-3">Expires: Nov 30, 2025</div>
                        <button className="flex items-center gap-2 text-sm text-[#0F172A] hover:text-[#00D68F] transition-colors">
                          <img src="/icons/upload.svg" alt="Upload" className="w-4 h-4" />
                          Update Document
                        </button>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Verified
                    </span>
                  </div>

                  {/* Background Check */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#F59E0B"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#0F172A] mb-1">Background Check</div>
                        <div className="text-xs text-[#64748B] mb-3">Last updated: 6 months ago</div>
                        <button className="flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-700 rounded-lg text-sm hover:bg-orange-50 transition-colors">
                          <img src="/icons/upload.svg" alt="Renew" className="w-4 h-4" />
                          Renew Now
                        </button>
                      </div>
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
                    <div className="text-sm font-medium text-[#00D68F]">85%</div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0F172A] rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <div className="text-xs text-[#64748B] mt-3">
                    Complete your emergency contact to reach 100%
                  </div>
                </div>
              </div>
            </>
          )}
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default RiderProfile;