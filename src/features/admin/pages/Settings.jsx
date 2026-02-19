import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Settings, DollarSign, Bell, Shield, Globe, AlertCircle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import StyledDropdown from '../../../components/StyledDropdown';
import { YummyText } from '../../../components/YummyText';
import { getPricingConfig, updatePricingConfig } from '../../../utils/adminApi';

const SettingsPage = () =>
{
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    newUserRegistrations: true,
    enableSurgePricing: true,
    showPriceBreakdown: true,
    newOrderNotifications: true,
    kycSubmissionAlerts: true,
    paymentNotifications: true,
    userRegistrationAlerts: false,
    systemErrorAlerts: true,
    dailySummaryReport: true,
    twoFactorAuth: true,
    passwordExpiry: false,
    sessionTimeout: true,
    ipWhitelist: false,
    debugMode: false,
    autoBackup: true
  });

  const handleToggle = (key) =>
  {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Pricing config (from backend)
  const [pricingConfig, setPricingConfig] = useState({
    baseFare: 800,
    perKmRate: 200,
    commissionRate: 0.15,
    defaultDebtLimit: -50,
    defaultDeclineLimit: 5,
  });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingMessage, setPricingMessage] = useState({ type: '', text: '' });

  useEffect(() =>
  {
    if (activeTab === 'pricing') {
      setPricingLoading(true);
      setPricingMessage({ type: '', text: '' });
      getPricingConfig()
        .then((res) =>
        {
          const d = res?.data ?? res;
          const p = d?.pricing ?? {};
          setPricingConfig({
            baseFare: p.baseFare ?? 800,
            perKmRate: p.perKmRate ?? 200,
            commissionRate: typeof p.commissionRate === 'number' ? p.commissionRate : 0.15,
            defaultDebtLimit: d?.defaultDebtLimit ?? -50,
            defaultDeclineLimit: d?.defaultDeclineLimit ?? 5,
          });
        })
        .catch((err) =>
        {
          setPricingMessage({ type: 'error', text: err?.message || 'Failed to load pricing config' });
        })
        .finally(() => setPricingLoading(false));
    }
  }, [activeTab]);

  const handleSavePricing = async () =>
  {
    setPricingSaving(true);
    setPricingMessage({ type: '', text: '' });
    try {
      const debtLimit = pricingConfig.defaultDebtLimit;
      const debtLimitForApi = typeof debtLimit === 'number' && debtLimit > 0 ? -debtLimit : debtLimit;
      await updatePricingConfig({
        baseFare: pricingConfig.baseFare,
        perKmRate: pricingConfig.perKmRate,
        commissionRate: pricingConfig.commissionRate,
        defaultDebtLimit: debtLimitForApi,
        defaultDeclineLimit: pricingConfig.defaultDeclineLimit,
      });
      setPricingMessage({ type: 'success', text: 'Pricing configuration saved successfully.' });
    } catch (err) {
      setPricingMessage({ type: 'error', text: err?.message || 'Failed to save pricing config' });
    } finally {
      setPricingSaving(false);
    }
  };

  React.useEffect(() =>
  {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className={isMobile ? 'ion-padding' : 'ion-no-padding'}>
          {/* Header */}
          <div className="mb-8">
            <YummyText className="text-3xl font-bold text-gray-900 mb-2">Settings</YummyText>
            <YummyText className="text-gray-500">Manage platform configuration and preferences</YummyText>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            {isMobile ? (
              <div className="mb-4">
                <StyledDropdown
                  value={
                    activeTab === 'general' ? 'General' :
                      activeTab === 'pricing' ? 'Pricing' :
                        activeTab === 'notifications' ? 'Notifications' :
                          activeTab === 'security' ? 'Security' :
                            'System'
                  }
                  onChange={(v) =>
                  {
                    const map = { General: 'general', Pricing: 'pricing', Notifications: 'notifications', Security: 'security', System: 'system' };
                    setActiveTab(map[v]);
                  }}
                  options={["General", "Pricing", "Notifications", "Security", "System"]}
                  className={'w-full border-[2.5px] border-gray-200 rounded-full'}
                  width={'w-full'}
                />
              </div>
            ) : (
              <div className="mb-8 bg-gray-200 rounded-full p-1 inline-flex">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'pricing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'notifications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'system' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                >
                  System
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${isMobile ? 'p-4' : 'p-8'}`}>
            {/* General Tab */}
            {activeTab === 'general' && (
              <div>
                <div className="flex items-center mb-2">
                  <Settings className="w-5 h-5 mr-2" />
                  <YummyText className="text-xl font-bold text-gray-900">General Settings</YummyText>
                </div>
                <YummyText className="text-gray-500 mb-8">Configure basic platform settings</YummyText>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Platform Name</label>
                    <input
                      type="text"
                      defaultValue="Swiftly Express"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Support Email</label>
                    <input
                      type="email"
                      defaultValue="support@swiftlyexpress.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Support Phone</label>
                    <input
                      type="tel"
                      defaultValue="+1 (800) 123-4567"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Default Timezone</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Pacific Time (PT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Default Language</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Maintenance Mode</YummyText>
                      <YummyText className="text-sm text-gray-500">Temporarily disable user access</YummyText>
                    </div>
                    <Toggle checked={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">New User Registrations</YummyText>
                      <YummyText className="text-sm text-gray-500">Allow new users to sign up</YummyText>
                    </div>
                    <Toggle checked={settings.newUserRegistrations} onChange={() => handleToggle('newUserRegistrations')} />
                  </div>
                </div>

                <button className={`mt-8 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors ${isMobile ? 'w-full' : ''}`}>
                  Save Changes
                </button>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div>
                <div className="flex items-center mb-2">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <YummyText className="text-xl font-bold text-gray-900">Pricing Configuration</YummyText>
                </div>
                <YummyText className="text-gray-500 mb-8">Manage delivery pricing, commission rates, and rider limits</YummyText>

                {pricingLoading ? (
                  <div className="py-12 text-center text-gray-500">Loading pricing config...</div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Base Fare (₦)</label>
                      <input
                        type="number"
                        value={pricingConfig.baseFare}
                        onChange={(e) => setPricingConfig((p) => ({ ...p, baseFare: Number(e.target.value) || 0 }))}
                        min="0"
                        step="10"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <YummyText className="text-xs text-gray-500 mt-1">Minimum charge for any delivery</YummyText>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Price per Kilometer (₦)</label>
                      <input
                        type="number"
                        value={pricingConfig.perKmRate}
                        onChange={(e) => setPricingConfig((p) => ({ ...p, perKmRate: Number(e.target.value) || 0 }))}
                        min="0"
                        step="10"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Platform Commission (%)</label>
                      <input
                        type="number"
                        value={Math.round((pricingConfig.commissionRate || 0) * 100)}
                        onChange={(e) => setPricingConfig((p) => ({ ...p, commissionRate: (Number(e.target.value) || 0) / 100 }))}
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <YummyText className="text-xs text-gray-500 mt-1">Percentage taken from each delivery (e.g. 15 for 15%)</YummyText>
                    </div>

                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <YummyText className="text-base font-semibold text-gray-900 mb-4">Rider Limits (Global Defaults)</YummyText>
                      <YummyText className="text-sm text-gray-500 mb-4">
                        These apply to all riders unless you set an individual limit on Manage Riders.
                      </YummyText>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">Default Decline Limit</label>
                          <input
                            type="number"
                            value={pricingConfig.defaultDeclineLimit}
                            onChange={(e) => setPricingConfig((p) => ({ ...p, defaultDeclineLimit: Math.max(0, Number(e.target.value) || 0) }))}
                            min="0"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <YummyText className="text-xs text-gray-500 mt-1">
                            Max delivery declines allowed per rider per day. Exceeding this disqualifies from incentives. Individual limits can be set per rider on Manage Riders.
                          </YummyText>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">Default Debt Limit (₦)</label>
                          <input
                            type="number"
                            value={Math.abs(pricingConfig.defaultDebtLimit || 0)}
                            onChange={(e) => setPricingConfig((p) => ({ ...p, defaultDebtLimit: -Math.abs(Number(e.target.value) || 0) }))}
                            min="0"
                            step="50"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <YummyText className="text-xs text-gray-500 mt-1">
                            Max debt (₦) a rider can owe before being blocked. Individual limits can be set per rider on Manage Riders.
                          </YummyText>
                        </div>
                      </div>

                      <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <YummyText className="text-sm text-blue-800">
                          Individual rider limits override these global defaults. To set a custom decline or debt limit for a specific rider, go to Manage Riders and use the rider actions.
                        </YummyText>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-gray-100">
                      <div>
                        <YummyText className="text-sm font-medium text-gray-900">Enable Surge Pricing</YummyText>
                        <YummyText className="text-sm text-gray-500">Automatic price adjustments during high demand</YummyText>
                      </div>
                      <Toggle checked={settings.enableSurgePricing} onChange={() => handleToggle('enableSurgePricing')} />
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-gray-100">
                      <div>
                        <YummyText className="text-sm font-medium text-gray-900">Show Price Breakdown</YummyText>
                        <YummyText className="text-sm text-gray-500">Display detailed pricing to users</YummyText>
                      </div>
                      <Toggle checked={settings.showPriceBreakdown} onChange={() => handleToggle('showPriceBreakdown')} />
                    </div>
                  </div>
                )}

                {pricingMessage.text && (
                  <p className={`mt-4 text-sm ${pricingMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {pricingMessage.text}
                  </p>
                )}

                <button
                  onClick={handleSavePricing}
                  disabled={pricingLoading || pricingSaving}
                  className={`mt-8 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'w-full' : ''}`}
                >
                  {pricingSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="flex items-center mb-2">
                  <Bell className="w-5 h-5 mr-2" />
                  <YummyText className="text-xl font-bold text-gray-900">Notification Preferences</YummyText>
                </div>
                <YummyText className="text-gray-500 mb-8">Configure system notifications and alerts</YummyText>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">New Order Notifications</YummyText>
                      <YummyText className="text-sm text-gray-500">Alert when new orders are placed</YummyText>
                    </div>
                    <Toggle checked={settings.newOrderNotifications} onChange={() => handleToggle('newOrderNotifications')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">KYC Submission Alerts</YummyText>
                      <YummyText className="text-sm text-gray-500">Notify when riders submit KYC documents</YummyText>
                    </div>
                    <Toggle checked={settings.kycSubmissionAlerts} onChange={() => handleToggle('kycSubmissionAlerts')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Payment Notifications</YummyText>
                      <YummyText className="text-sm text-gray-500">Alert on successful/failed payments</YummyText>
                    </div>
                    <Toggle checked={settings.paymentNotifications} onChange={() => handleToggle('paymentNotifications')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">User Registration Alerts</YummyText>
                      <YummyText className="text-sm text-gray-500">Notify when new users sign up</YummyText>
                    </div>
                    <Toggle checked={settings.userRegistrationAlerts} onChange={() => handleToggle('userRegistrationAlerts')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">System Error Alerts</YummyText>
                      <YummyText className="text-sm text-gray-500">Critical system errors and failures</YummyText>
                    </div>
                    <Toggle checked={settings.systemErrorAlerts} onChange={() => handleToggle('systemErrorAlerts')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Daily Summary Report</YummyText>
                      <YummyText className="text-sm text-gray-500">Receive daily platform statistics</YummyText>
                    </div>
                    <Toggle checked={settings.dailySummaryReport} onChange={() => handleToggle('dailySummaryReport')} />
                  </div>

                  <div className="mt-8">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Notification Email</label>
                    <input
                      type="email"
                      defaultValue="admin@swiftyexpress.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button className={`mt-8 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors ${isMobile ? 'w-full' : ''}`}>
                  Save Changes
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 mr-2" />
                  <YummyText className="text-xl font-bold text-gray-900">Security Settings</YummyText>
                </div>
                <YummyText className="text-gray-500 mb-8">Manage security and access controls</YummyText>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Two-Factor Authentication</YummyText>
                      <YummyText className="text-sm text-gray-500">Require 2FA for admin accounts</YummyText>
                    </div>
                    <Toggle checked={settings.twoFactorAuth} onChange={() => handleToggle('twoFactorAuth')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Password Expiry</YummyText>
                      <YummyText className="text-sm text-gray-500">Force password change every 90 days</YummyText>
                    </div>
                    <Toggle checked={settings.passwordExpiry} onChange={() => handleToggle('passwordExpiry')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Session Timeout</YummyText>
                      <YummyText className="text-sm text-gray-500">Auto-logout after 30 minutes of inactivity</YummyText>
                    </div>
                    <Toggle checked={settings.sessionTimeout} onChange={() => handleToggle('sessionTimeout')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">IP Whitelist</YummyText>
                      <YummyText className="text-sm text-gray-500">Restrict admin access to specific IPs</YummyText>
                    </div>
                    <Toggle checked={settings.ipWhitelist} onChange={() => handleToggle('ipWhitelist')} />
                  </div>

                  <div className="mt-8">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Minimum Password Length</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>8 characters</option>
                      <option>10 characters</option>
                      <option>12 characters</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Max Login Attempts</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>5 attempts</option>
                      <option>3 attempts</option>
                      <option>10 attempts</option>
                    </select>
                  </div>
                </div>

                <button className="mt-8 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div>
                <div className="flex items-center mb-2">
                  <Globe className="w-5 h-5 mr-2" />
                  <YummyText className="text-xl font-bold text-gray-900">System Configuration</YummyText>
                </div>
                <YummyText className="text-gray-500 mb-8">Advanced system settings and maintenance</YummyText>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">API Version</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Version 2.0 (Current)</option>
                      <option>Version 1.5</option>
                      <option>Version 1.0</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Cache Duration (hours)</label>
                    <input
                      type="number"
                      defaultValue="24"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Log Retention (days)</label>
                    <input
                      type="number"
                      defaultValue="90"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Debug Mode</YummyText>
                      <YummyText className="text-sm text-gray-500">Enable detailed error logging</YummyText>
                    </div>
                    <Toggle checked={settings.debugMode} onChange={() => handleToggle('debugMode')} />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <YummyText className="text-sm font-medium text-gray-900">Auto Backup</YummyText>
                      <YummyText className="text-sm text-gray-500">Automatic daily database backups</YummyText>
                    </div>
                    <Toggle checked={settings.autoBackup} onChange={() => handleToggle('autoBackup')} />
                  </div>

                  <div className="mt-8 space-y-3">
                    <button className="w-full bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-lg text-sm font-medium border border-gray-200 transition-colors">
                      Clear Cache
                    </button>
                    <button className="w-full bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-lg text-sm font-medium border border-gray-200 transition-colors">
                      Export Database
                    </button>
                    <button className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
                      Reset All Settings
                    </button>
                  </div>
                </div>

                <button className={`mt-8 w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors ${isMobile ? '' : ''}`}>
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default SettingsPage;