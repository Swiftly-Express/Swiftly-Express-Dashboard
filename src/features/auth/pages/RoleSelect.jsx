import { IonPage, IonContent, useIonRouter } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import { YummyText } from '../../../components/YummyText';

const RoleSelect = () => {
  console.log('[RoleSelect] Component mounting...');

  const router = useIonRouter();
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' or 'rider'

  useEffect(() => {
    console.log('[RoleSelect] Component mounted successfully');
    console.log('[RoleSelect] Router available:', !!router);
    console.log('[RoleSelect] Selected role:', selectedRole);
    return () => {
      console.log('[RoleSelect] Component unmounting');
    };
  }, []);

  const handleRiderSignup = () => {
    console.log('[RoleSelect] Rider signup clicked');
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/rider/signup', 'forward', 'push');
  };

  const handleCustomerSignup = () => {
    console.log('[RoleSelect] Customer signup clicked');
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/customer/signup', 'forward', 'push');
  };

  const handleRiderSignin = () => {
    console.log('[RoleSelect] Rider signin clicked');
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/rider/login', 'forward', 'push');
  };

  const handleCustomerSignin = () => {
    console.log('[RoleSelect] Customer signin clicked');
    if (document && document.activeElement) document.activeElement.blur();
    router.push('/auth/customer/login', 'forward', 'push');
  };

  console.log('[RoleSelect] Rendering with role:', selectedRole);

  return (
    <IonPage>
      <IonContent className="ion-no-padding" scrollY={false}>
        <div className="h-screen bg-[#F5F5F5] flex flex-col p-3 md:p-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-hidden min-h-0">
            {/* Rider Card */}
            <div className={`relative bg-[#1E1E1E] rounded-3xl md:rounded-[32px] p-5 md:p-8 flex flex-col justify-between overflow-hidden ${selectedRole === 'rider' ? 'flex' : 'hidden md:flex'}`}>
              <div className="relative w-full flex justify-center flex-shrink-0">
                <img
                  src="/despatch-man.svg"
                  alt="Delivery Rider on Motorcycle"
                  className="w-[85%] md:w-[95%] h-auto object-contain max-h-[60vh] md:max-h-[45vh]"
                />
              </div>

              <div className="relative z-10 flex-shrink-0">
                <YummyText>
                  <div className="text-[35px] md:text-[38px] font-[300] text-white leading-tight mb-2">
                    Become a<br />Swiftly <span className="text-[#00D68F]  font-semibold">Rider</span>
                  </div>
                  <div className="text-[#FFFFFF] font-[400] text-[14px] md:text-[15px] leading-tight mt-1.5 mb-3 md:mb-3 md:max-w-md opacity-90">
                    Earn more while delivering faster. Join Swiftly's growing network of professional riders and start receiving delivery requests instantly.
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleRiderSignup}
                    className="!bg-[#00D68F] hover:!bg-[#00B876] mb-1 !text-white text-xs md:text-sm font-[500] mx-auto md:mx-0 w-auto !px-5 md:!px-4 !py-2 md:!py-2 rounded-full transition-all duration-300"
                  >
                    <div>Create Account</div>
                  </Button>
                  <div className="hidden md:block text-white text-[11px] md:text-[13px]">
                    Already have an account? <span onClick={handleRiderSignin} className="text-[#00D68F] font-medium cursor-pointer hover:underline"> Sign in</span>
                  </div>
                </YummyText>
              </div>
            </div>

            {/* Customer Card */}
            <div className={`relative bg-[#00B75A] rounded-3xl md:rounded-[32px] p-5 md:p-8 flex flex-col justify-between overflow-hidden ${selectedRole === 'customer' ? 'flex' : 'hidden md:flex'}`}>
              <div className="relative z-10 flex-shrink-0">
                <YummyText>
                  <div className="text-[15px] md:text-[15px] text-white mb-4 md:mb-1 opacity-90 leading-tight font-[400]">
                    Need fast delivery? Sign up on Swiftly to send <br className="hidden md:inline" />parcels safely, reliably, and in minutes.
                  </div>
                  <div className="text-[32px] md:text-[38px] font-[300] leading-none text-white mb-4 md:mb-1">
                    Send Packages<br />with <span className="text-[#1E1E1E] font-semibold">Ease</span>
                  </div>
                  <Button
                    variant="light"
                    onClick={handleCustomerSignup}
                    className="!bg-white hover:!bg-gray-50 text-sm md:text-sm mb-2 font-[500] !text-[#1E1E1E] mx-auto md:mx-0 w-auto !px-8 md:!px-4 !py-3 md:!py-2 rounded-full transition-all duration-300"
                  >
                    <div>Create Account</div>
                  </Button>
                  <div className="hidden md:block text-white text-[11px] md:text-[13px]">
                    Already have an account? <span onClick={handleCustomerSignin} className="text-[#1E1E1E] font-medium cursor-pointer hover:underline"> Sign in</span>
                  </div>
                </YummyText>
              </div>

              <div className="absolute right-0 bottom-0 w-[82%] md:w-[49%] flex-shrink-0">
                <img
                  src="/lady-package.svg"
                  alt="Customer with Packages"
                  className="w-full h-auto object-contain max-h-[57vh] md:max-h-[65vh]"
                />
              </div>
            </div>
          </div>

          {/* Role Toggle Buttons - Mobile Only */}
          <YummyText>
            <div 
              className="flex md:hidden gap-2 mt-3 px-1 flex-shrink-0"
              style={{
                paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
                position: 'relative',
                zIndex: 50,
                minHeight: '60px'
              }}
            >
              <button
                onClick={() => setSelectedRole('customer')}
                className={`flex-1 py-3.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedRole === 'customer'
                    ? 'bg-[#00B75A] text-white shadow-lg'
                    : 'bg-white text-[#1E1E1E] border-2 border-gray-300'
                }`}
                style={{ 
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                Customer
              </button>
              <button
                onClick={() => setSelectedRole('rider')}
                className={`flex-1 py-3.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedRole === 'rider'
                    ? 'bg-[#1E1E1E] text-white shadow-lg'
                    : 'bg-white text-[#1E1E1E] border-2 border-gray-300'
                }`}
                style={{ 
                  minHeight: '48px',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                Rider
              </button>
            </div>
          </YummyText>
        </div>

        {/* MOBILE ONLY: CSS fixes for iOS Safari and viewport issues */}
        <style jsx>{`
          @media (max-width: 767px) {
            /* iOS Safari viewport fix */
            .h-screen {
              min-height: 100vh;
              min-height: -webkit-fill-available;
            }

            /* Prevent iOS Safari from hiding bottom tabs */
            @supports (-webkit-touch-callout: none) {
              .h-screen {
                min-height: 100vh;
                height: 100vh;
              }
            }

            /* Ensure safe area for devices with notch/home indicator */
            body {
              padding-bottom: env(safe-area-inset-bottom);
            }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default RoleSelect;