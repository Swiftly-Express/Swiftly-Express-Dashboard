import React, { useState } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [settings, setSettings] = useState({
    platformName: 'Swiftly Express',
    supportEmail: 'support@swiftlyxpress.com',
    supportPhone: '+234 800 000 0000',
    commission: '15',
    minimumDeliveryFee: '500',
    maximumDeliveryRadius: '50',
  });

  const handleSave = () => {
    // TODO: Replace with actual API call
    setToastMsg('Settings saved successfully');
    setShowToast(true);
  };

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-padding">
          <YummyText>
            <div className="mb-6">
              <h1 className="text-3xl font-medium text-[#0F172A] mb-2">Settings</h1>
              <p className="text-[#64748B]">Manage platform configuration</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-[#00D68F] text-[#00D68F]'
                    : 'border-transparent text-gray-500'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'pricing'
                    ? 'border-[#00D68F] text-[#00D68F]'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Pricing
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-[#00D68F] text-[#00D68F]'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Notifications
              </button>
            </div>

            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-medium text-[#0F172A] mb-6">General Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Support Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.supportPhone}
                      onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Settings */}
            {activeTab === 'pricing' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-medium text-[#0F172A] mb-6">Pricing Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Platform Commission (%)
                    </label>
                    <input
                      type="number"
                      value={settings.commission}
                      onChange={(e) => setSettings({ ...settings, commission: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Minimum Delivery Fee (₦)
                    </label>
                    <input
                      type="number"
                      value={settings.minimumDeliveryFee}
                      onChange={(e) => setSettings({ ...settings, minimumDeliveryFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Maximum Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      value={settings.maximumDeliveryRadius}
                      onChange={(e) => setSettings({ ...settings, maximumDeliveryRadius: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-medium text-[#0F172A] mb-6">Notification Settings</h2>
                <div className="text-[#64748B]">Email and push notification settings coming soon</div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6">
              <button
                onClick={handleSave}
                className="bg-[#00D68F] hover:bg-[#00B75A] text-white px-6 py-3 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </YummyText>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            position="top"
          />
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default Settings;
