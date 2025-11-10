import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import React from 'react';
import Button from '../components/Button';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ProcessStep = ({ icon, title }) => (
  <div className="flex flex-col items-center text-center">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
      title === 'Enter Package Details' ? 'bg-violet-500' :
      title === 'Secure payment' ? 'bg-[#FF4D00]' :
      title === 'Choose Pickup/Delivery' ? 'bg-blue-500' :
      title === 'Create Your Account' ? 'bg-[#00D68F]' :
      title === 'Delivery Confirmation' ? 'bg-[#00D68F]' :
      'bg-red-500' // Real-Time Tracking
    }`}>
      <img src={icon} alt={title} className="w-8 h-8" />
    </div>
    <YummyText className="mt-2 text-[#111827] text-sm">{title}</YummyText>
  </div>
);

const HowItWorks = () => {
  const steps = [
    { icon: '/phoneicon.svg', title: 'Create Your Account' },
    { icon: '/blockicon-white.svg', title: 'Enter Package Details' },
    { icon: '/locationicon-white.svg', title: 'Choose Pickup/Delivery' },
    { icon: '/cardicon.svg', title: 'Secure payment' },
    { icon: '/vanicon-white.svg', title: 'Real-Time Tracking' },
    { icon: '/checkicon.svg', title: 'Delivery Confirmation' }
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white px-3">
          <PageWrapper className="py-3 flex items-center justify-between">
            {/* Logo */}
            <YummyText className="text-3xl px-3 font-sm text-black">
              Swiftly
            </YummyText>

            {/* Navbar */}
            <Navbar />

            {/* Buttons */}
            <div className="flex items-center px-4 gap-3">
              <Button 
              variant="primary" 
              className="!px-3 !py-2 font-[100] text-[9px]"
              onClick={() => window.location.href = '/auth/customer/signup'}
              >
                <YummyText>Book a delivery</YummyText>
              </Button>
              <Button 
              variant="dark" 
              className="!px-2.5 !py-2 font-[100] text-[9px]"
              onClick={() => window.location.href = '/auth/role-select'}
              >
                <YummyText>Get Started</YummyText>
              </Button>
            </div>
          </PageWrapper>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-[#f5f5f5] ion-no-padding">
        {/* Hero Section */}
        <div className="relative w-full bg-[#006837] py-12 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/riderman.svg"
              alt="Traffic Light"
              className="w-full h-full object-cover opacity-20"
            />
          </div>

          <PageWrapper>
            <div className="relative py-20 text-center text-white">
              <YummyText className="text-5xl font-medium mb-4">
                How Swiftly Works
              </YummyText>
              <YummyText className="text-lg opacity-90 flex max-w-2xl mx-auto">
                From booking to delivery, we've made the entire process simple, transparent, and reliable. Here's everything you need to know.
              </YummyText>
            </div>
          </PageWrapper>
        </div>

        <PageWrapper>
          {/* Process Section */}
          <section className="py-0">
            <div className="text-center -mb-1 mt-8 space-y-1">
              <YummyText className="text-4xl font-[300] text-[#111827]">
                The Complete Process
              </YummyText>
              <YummyText className="text-[#4B5563] flex !justify-center text-sm">
                Six simple steps to get your package from point A to point B
                <br />with complete peace of mind
              </YummyText>
            </div>

            {/* Process Steps */}
            <div className="relative min-h-[500px]">
              {/* Spiral Connection Line */}
               <div className="absolute inset-0 -left-36 -right-36 h-[430px]">
                <img 
                  src="/spiralicon.svg" 
                  alt="Process Flow"
                  className="w-full h-full object-fill"
                />
              </div>
              
              {/* Steps Positioned */}
              <div className="relative z-10">
                {/* Row 1 */}
                <div className="absolute top-20 mt-20 left-[2%]">
                  <ProcessStep {...steps[0]} />
                </div>
                <div className="absolute top-20 left-[28%]">
                  <ProcessStep {...steps[1]} />
                </div>
                <div className="absolute top-[90px] right-[26%]">
                  <ProcessStep {...steps[3]} />
                </div>

                {/* Row 2 */}
                <div className="absolute top-[350px] left-[26%]">
                  <ProcessStep {...steps[2]} />
                </div>
                <div className="absolute top-[364px] right-[23%]">
                  <ProcessStep {...steps[4]} />
                </div>

                {/* Row 3 */}
                <div className="absolute top-[130px] right-[0%]">
                  <ProcessStep {...steps[5]} />
                </div>
              </div>
            </div>
          </section>
        </PageWrapper>

        {/* Process Cards */}
        <PageWrapper>
          <section className="py-10 grid grid-cols-1 md:grid-cols-3 gap-4 px-3">
            {/* 01 Create Your Account */}
            <div className="bg-[#00D68F] rounded-2xl p-8 h-[410px] text-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <YummyText className="text-2xl font-light">01</YummyText>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <img src="/phoneicon.svg" alt="" className="w-5 h-5" />
                  </div>
                </div>
                <YummyText className="text-2xl mb-3 whitespace-nowrap">Create Your Account</YummyText>
                <YummyText className="text-sm opacity-90 mb-6">
                  Sign up in seconds using your email or phone number. No complicated forms, no hidden fees. Get instant access to our platform via web or mobile app.
                </YummyText>
                <ul className="space-y-2">
                  {['Secure account setup', 'Instant verification', 'Multi-platform access'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <img src="/checkicon.svg" alt="" className="w-4 h-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 02 Enter Package Details */}
            <div className="bg-violet-500 rounded-2xl p-8 h-[410px] text-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <YummyText className="text-2xl font-light">02</YummyText>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <img src="/blockicon-white.svg" alt="" className="w-5 h-5" />
                  </div>
                </div>
                <YummyText className="text-2xl mb-3 whitespace-nowrap">Enter Package Details</YummyText>
                <YummyText className="text-sm opacity-90 mb-6">
                  Provide information about your package including size, weight, notes and essentials. Our smart system calculates the best option for you.
                </YummyText>
                <ul className="space-y-2">
                  {['Smart information form', 'Automatic pricing calculation', 'Multiple package support', 'Special handling options'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <img src="/checkicon.svg" alt="" className="w-4 h-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 03 Choose Pickup/Delivery */}
            <div className="bg-blue-500 rounded-2xl p-8 h-[410px] text-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <YummyText className="text-2xl font-light">03</YummyText>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <img src="/locationicon-white.svg" alt="" className="w-5 h-5" />
                  </div>
                </div>
                <YummyText className="text-2xl mb-3 whitespace-nowrap">Choose Pickup/Delivery</YummyText>
                <YummyText className="text-sm opacity-90 mb-6">
                  Select your preferred pickup time and delivery address, including alternative addresses or set a convenient time that works for your schedule.
                </YummyText>
                <ul className="space-y-2">
                  {['Flexible scheduling', 'Multiple address management', 'Recurring delivery options', 'Address validation'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <img src="/checkicon.svg" alt="" className="w-4 h-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 04 Secure Payment */}
            <div className="bg-[#FF4D00] rounded-2xl p-8 h-[410px] text-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <YummyText className="text-2xl font-light">04</YummyText>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <img src="/cardicon.svg" alt="" className="w-5 h-5" />
                  </div>
                </div>
                <YummyText className="text-2xl mb-3 whitespace-nowrap">Secure Payment</YummyText>
                <YummyText className="text-sm opacity-90 mb-6">
                  Choose your payment method and complete the transaction securely. We accept all major credit cards, digital wallets and other cash on delivery options.
                </YummyText>
                <ul className="space-y-2">
                  {['Multiple payment methods', 'Secure encryption', 'Save payment info', 'Instant confirmation'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <img src="/checkicon.svg" alt="" className="w-4 h-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 05 Real-Time Tracking */}
            <div className="bg-red-500 rounded-2xl p-8 h-[410px] text-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <YummyText className="text-2xl font-light">05</YummyText>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <img src="/vanicon-white.svg" alt="" className="w-5 h-5" />
                  </div>
                </div>
                <YummyText className="text-2xl mb-3 whitespace-nowrap">Real-Time Tracking</YummyText>
                <YummyText className="text-sm opacity-90 mb-6">
                  Track your package every step of the way with live GPS tracking. Get real-time updates at each milestone from pickup to delivery.
                </YummyText>
                <ul className="space-y-2">
                  {['Live GPS tracking', 'Driver contact information', 'ETA updates', 'Route visualization'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <img src="/checkicon.svg" alt="" className="w-4 h-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 06 Delivery Confirmation */}
            <div className="bg-[#00D68F] rounded-2xl p-8 h-[410px] text-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <YummyText className="text-2xl font-light">06</YummyText>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <img src="/checkicon.svg" alt="" className="w-5 h-5" />
                  </div>
                </div>
                <YummyText className="text-2xl mb-3 whitespace-nowrap">Delivery Confirmation</YummyText>
                <YummyText className="text-sm opacity-90 mb-6">
                  Receive photos of delivery and electronic signature from your experience and help us maintain our high service standards.
                </YummyText>
                <ul className="space-y-2">
                  {['Photo proof of delivery', 'Digital signature', 'Delivery rating system', 'Issue resolution support'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <img src="/checkicon.svg" alt="" className="w-4 h-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </PageWrapper>

        {/* ✅ LIVE GPS TRACKING (Perfect Match — Two Images, Right-Aligned) */}
        <section className="w-full flex justify-center mt-2 px-12">
          <div className="relative w-full max-w-5xl bg-[#1A1A1A] rounded-[40px] py-12 mb-8 px-14 flex items-center justify-between overflow-hidden">

            {/* LEFT TEXT */}
            <div className="max-w-lg z-10">
              <YummyText className="text-3xl mb-3 text-[#F9FAFB] flex">Live GPS Tracking</YummyText>
              <YummyText className="text-sm opacity-90 leading-relaxed mb-7 text-[#F9FAFB]">
                Our advanced tracking system uses GPS technology to give you real-time
                updates on your package location. Watch as your driver moves closer to
                the destination, with accurate ETA calculations based on traffic conditions.
              </YummyText>

              <Button
                variant="light"
                className="!bg-[#16A34A] hover:!bg-[#149C46] flex text-xs !text-white mt-4 !px-4 !py-3 rounded-lg"
              >
                <YummyText>Try Demo Tracking</YummyText>
              </Button>
            </div>

            {/* RIGHT IMAGES (Two images layered exactly like your screenshot) */}
            <div className="relative  w-[30%] flex items-center justify-center">

              {/* FLOATING PACKAGE (TOP IMAGE) */}
              <img
                src="/phonemap-flyingbox.svg"
                alt="Flying Package"
                className="absolute right-10 w-85 h-auto object-contain z-20"
              />

              {/* PHONE GPS IMAGE (BOTTOM IMAGE) */}
              {/* <img
                src="/phonemap.svg"
                alt="GPS Phone UI"
                className="relative w-72 h-auto object-contain z-10 mt-10"
              /> */}
            </div>

          </div>
        </section>


        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default HowItWorks;
