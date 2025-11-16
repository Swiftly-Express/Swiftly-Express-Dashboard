import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';

const sideBottomShadow = {
  boxShadow: '2px 2px 4px rgba(0,0,0,0.06), -2px 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const CustomerProfile = () => {
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+234 812 345 6789',
    address: '123 Main Street, Lagos',
    city: 'Lagos',
    state: 'Lagos State'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updating profile:', formData);
    setIsEditing(false);
    // Add update logic here
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8 py-2">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              My Profile
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              Manage your account information and preferences.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-white p-8 rounded-2xl" style={sideBottomShadow}>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B876] flex items-center justify-center overflow-hidden mb-4">
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" 
                    alt="Profile" 
                    className="w-full h-full" 
                  />
                </div>
                <div className="text-xl font-medium text-[#0F172A] mb-1">
                  {formData.fullName}
                </div>
                <div className="text-sm text-[#64748B] mb-4">
                  Customer
                </div>
                <button className="text-[#00D68F] hover:underline text-sm font-normal">
                  Change Photo
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                <div>
                  <div className="text-xs text-[#64748B] mb-1">Member Since</div>
                  <div className="text-sm text-[#0F172A]">January 2025</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] mb-1">Total Deliveries</div>
                  <div className="text-sm text-[#0F172A]">127</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] mb-1">Account Status</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-[#0F172A]">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl" style={sideBottomShadow}>
              <div className="flex items-center justify-between mb-6">
                <div className="text-xl font-normal text-[#0F172A]">
                  Personal Information
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[#00D68F] hover:underline text-sm font-normal"
                  >
                    Edit Profile
                  </button>
                ) : null}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500 border-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500 border-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500 border-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500 border-none disabled:opacity-60"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500 border-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl bg-[#F3F3F5] focus:outline-none focus:ring-2 focus:ring-green-500 border-none disabled:opacity-60"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-8 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-[#0F172A] font-normal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-[#00D68F] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-6 bg-white p-8 rounded-2xl" style={sideBottomShadow}>
            <div className="text-xl font-normal text-[#0F172A] mb-6">
              Security
            </div>
            <button className="text-[#00D68F] hover:underline text-sm font-normal">
              Change Password
            </button>
          </div>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default CustomerProfile;
