import { IonPage, IonContent, useIonRouter } from '@ionic/react';
import React from 'react';
import Button from '../../../components/Button';
import { YummyText } from '../../../components/YummyText';

const RoleSelect = () => {
  const router = useIonRouter();

  const handleRiderSignup = () => {
    // remove focus from any element on the current page before navigating
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/rider/signup', 'forward', 'push');
  };

  const handleCustomerSignup = () => {
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/customer/signup', 'forward', 'push');
  };

  return (
    <IonPage>
      <IonContent className="ion-no-padding">
        <div className="min-h-screen bg-[#F5F5F5] grid grid-cols-1 md:grid-cols-2 gap-8 !p-4">
          {/* Rider Card - Left Side (Black) */}
          <div className="relative bg-[#1E1E1E] rounded-[32px] p-12 flex flex-col overflow-hidden min-h-[750px]">
            {/* Rider Illustration - Top */}
            <div className="relative w-full flex justify-center mb-8">
              <img 
                src="/despatch-man.svg" 
                alt="Delivery Rider on Motorcycle"
                className="w-[85%] h-auto object-cover"
              />
            </div>

            {/* Content - Bottom */}
            <div className="relative z-10 mt-auto">
              <YummyText className="text-[45px] font-[300] text-white leading-none">
                Become a<br />Swiftly <span className="text-[#00D68F] font-semibold">Rider</span>
              </YummyText>
              <YummyText className="text-[#FFFFFF] font-[400] text-lg flex leading-tight mt-2 mb-5 max-w-md opacity-90">
                Earn more while delivering faster. Join Swiftly's <br /> growing network of professional riders and start <br /> receiving delivery requests instantly.
              </YummyText>
              <Button
                variant="primary"
                onClick={handleRiderSignup}
                className="!bg-[#00D68F] hover:!bg-[#00B876] !text-white text-xs font-[500] !px-6 !py-3 rounded-xl transition-all duration-300"
              >
                <YummyText>Create Account</YummyText>
              </Button>
              <YummyText className="text-white text-sm mt-4">
                Already have an account? <span className="text-[#00D68F] font-medium cursor-pointer hover:underline">Sign in</span>
              </YummyText>
            </div>
          </div>

          {/* Customer Card - Right Side (Green) */}
          <div className="relative bg-[#00B75A] rounded-[32px] p-12 flex flex-col justify-between overflow-hidden min-h-[750px]">
            {/* Content */}
            <div className="relative z-10 mt-8">
              <YummyText className="text-lg text-white mb-4 opacity-90 leading-[1.3] font-[400]">
                Need fast delivery? Sign up on Swiftly to send parcels <br /> safely, reliably, and in minutes.
              </YummyText>
              <YummyText className="text-[45px] font-[300] leading-none break text-white mb-6">
                Send Packages<br />with <span className="text-[#1E1E1E] font-semibold">Ease</span>
              </YummyText>
              <Button
                variant="light"
                onClick={handleCustomerSignup}
                className="!bg-white hover:!bg-gray-50 text-xs font-[500] !text-[#1E1E1E] !px-6 !py-3 rounded-xl transition-all duration-300"
              >
                <YummyText>Create Account</YummyText>
              </Button>
              <YummyText className="text-white text-sm mt-4">
                Already have an account? <span className="text-[#1E1E1E] font-medium cursor-pointer hover:underline">Sign in</span>
              </YummyText>
            </div>

            {/* Customer Illustration with Packages */}
            <div className="absolute right-0 bottom-0 w-[85%]">
              <img 
                src="/lady-package.svg" 
                alt="Customer with Packages"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RoleSelect;