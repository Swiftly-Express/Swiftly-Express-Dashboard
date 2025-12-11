import { IonPage, IonContent, useIonRouter } from '@ionic/react';
import React, { useState } from 'react';
import Button from '../../../components/Button';
import { YummyText } from '../../../components/YummyText';

const RoleSelect = () => {
  const router = useIonRouter();
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' or 'rider'

  const handleRiderSignup = () => {
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/rider/signup', 'forward', 'push');
  };

  const handleCustomerSignup = () => {
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/customer/signup', 'forward', 'push');
  };

  const handleRiderSignin = () => {
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/rider/login', 'forward', 'push');
  };

  const handleCustomerSignin = () => {
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/customer/login', 'forward', 'push');
  };

  return (
    <IonPage>
      <IonContent className="ion-no-padding">
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col p-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Rider Card */}
            <div className={`relative bg-[#1E1E1E] rounded-[32px] p-6 md:p-12 flex flex-col overflow-hidden ${selectedRole === 'rider' ? 'block' : 'hidden md:flex'}`}>
              <div className="relative w-full flex justify-center mb-4 md:mb-8">
                <img 
                  src="/despatch-man.svg" 
                  alt="Delivery Rider on Motorcycle"
                  className="w-[78%] md:w-[80%] h-auto object-cover"
                />
              </div>

              <div className="relative z-10 mt-auto">
                <YummyText className="text-[32px] md:text-[45px] font-[300] text-white leading-none mb-3 md:mb-0">
                  Become a<br />Swiftly <span className="text-[#00D68F] font-semibold">Rider</span>
                </YummyText>
                <YummyText className="text-[#FFFFFF] font-[400] text-[13px] md:text-lg flex leading-snug mt-2 mb-4 md:mb-5 md:max-w-md opacity-90">
                  Earn more while delivering faster. Join Swiftly's <br className="hidden md:inline" /> growing network of professional riders and start <br className="hidden md:inline" /> receiving delivery requests instantly.
                </YummyText>
                <Button
                  variant="primary"
                  onClick={handleRiderSignup}
                  className="!bg-[#00D68F] hover:!bg-[#00B876] mb-3 md:mb-3 !text-white text-sm md:text-xs font-[500] mx-auto md:mx-0 w-auto md:w-auto !px-6 !py-2.5 rounded-full transition-all duration-300"
                >
                  <YummyText>Create Account</YummyText>
                </Button>
                <YummyText className="hidden md:block text-white text-[13px] md:text-sm">
                  Already have an account? <span onClick={handleRiderSignin} className="text-[#00D68F] font-medium cursor-pointer hover:underline"> Sign in</span>
                </YummyText>
              </div>
            </div>

            {/* Customer Card */}
            <div className={`relative bg-[#00B75A] rounded-[32px] p-8 md:p-12 flex flex-col md:justify-between overflow-hidden ${selectedRole === 'customer' ? 'block' : 'hidden md:flex'}`}>
              <div className="relative z-10 md:mt-8">
                <YummyText className="text-normal md:text-lg text-white mb-8 md:mb-4 opacity-90 leading-[1.4] md:leading-[1.3] font-[400]">
                  Need fast delivery? Sign up on <br /> Swiftly to send parcels safely, <br /> reliably, and in minutes.
                </YummyText>
                <YummyText className="text-[36px] md:text-[45px] font-[300] leading-none text-white mb-8 md:mb-6">
                  Send Packages<br />with <span className="text-[#1E1E1E] font-semibold">Ease</span>
                </YummyText>
                <Button
                  variant="light"
                  onClick={handleCustomerSignup}
                  className="!bg-white hover:!bg-gray-50 text-sm md:text-xs mb-4 md:mb-3 font-[500] !text-[#1E1E1E] mx-auto md:mx-0 w-auto md:w-auto !px-6 !py-2.5 rounded-full transition-all duration-300"
                >
                  <YummyText>Create Account</YummyText>
                </Button>
                <YummyText className="hidden md:block text-white text-sm md:!mt-4">
                  Already have an account? <span onClick={handleCustomerSignin} className="text-[#1E1E1E] font-medium cursor-pointer hover:underline"> Sign in</span>
                </YummyText>
              </div>

              <div className="absolute right-0 -bottom-6 md:bottom-0 w-[75%] md:w-[80%]">
                <img 
                  src="/lady-package.svg" 
                  alt="Customer with Packages"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Role Toggle Buttons - Mobile Only */}
          <div className="flex md:hidden gap-3 mt-4 px-2">
            <button
              onClick={() => setSelectedRole('customer')}
              className={`flex-1 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedRole === 'customer'
                  ? 'bg-[#00B75A] text-white'
                  : 'bg-white text-[#1E1E1E] border border-gray-300'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setSelectedRole('rider')}
              className={`flex-1 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedRole === 'rider'
                  ? 'bg-[#00B75A] text-white'
                  : 'bg-white text-[#1E1E1E] border border-gray-300'
              }`}
            >
              Rider
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RoleSelect;