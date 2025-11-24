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
      <IonContent className="ion-no-padding !fullscreen">
        <div className="min-h-screen justify-between bg-[#F5F5F5] grid grid-cols-1 md:grid-cols-2 gap-8 !p-4">
          <div className="relative bg-[#1E1E1E] rounded-[32px] p-12 flex flex-col overflow-hidden">
            <div className="relative w-full flex justify-center mb-8">
              <img 
                src="/despatch-man.svg" 
                alt="Delivery Rider on Motorcycle"
                className="w-[80%] h-auto object-cover"
              />
            </div>

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
                className="!bg-[#00D68F] hover:!bg-[#00B876] mb-3 !text-white text-xs font-[500] !px-6 !py-3 rounded-xl transition-all duration-300"
              >
                <YummyText>Create Account</YummyText>
              </Button>
              <YummyText className="text-white text-sm">
                Already have an account? <span onClick={handleRiderSignin} className="text-[#00D68F] font-medium cursor-pointer hover:underline"> Sign in</span>
              </YummyText>
            </div>
          </div>

          <div className="relative bg-[#00B75A] rounded-[32px] p-12 flex flex-col justify-between overflow-hidden">
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
                className="!bg-white hover:!bg-gray-50 text-xs mb-3 font-[500] !text-[#1E1E1E] !px-6 !py-3 rounded-xl transition-all duration-300"
              >
                <YummyText>Create Account</YummyText>
              </Button>
              <YummyText className="text-white text-sm !mt-4">
                Already have an account? <span onClick={handleCustomerSignin} className="text-[#1E1E1E] font-medium cursor-pointer hover:underline"> Sign in</span>
              </YummyText>
            </div>

            {/* Customer Illustration with Packages */}
            <div className="absolute right-0 bottom-0 w-[80%]">
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