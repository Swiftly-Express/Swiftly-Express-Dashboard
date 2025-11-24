import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import React from 'react';
import { useHistory } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-lg p-8 border border-gray-200">
    <div className="-mb-4">
      <div className="w-16 h-16 rounded-full mt-1 flex-start items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="mt-6">
      <YummyText className="text-xl font-medium text-gray-900 mb-3">
        {title}
      </YummyText>
      <YummyText className="text-sm text-gray-600 mt-3 flex leading-relaxed">
        {description}
      </YummyText>
    </div>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="text-center p-6">
    <div className="flex justify-center !mb-4">
      <div className="w-14 h-14 rounded-full bg-[#00D68F] flex items-center justify-center">
        <span className="text-white text-lg font-[200]">{number}</span>
      </div>
    </div>
    <YummyText className="text-medium font-medium text-gray-900 mb-4">
      {title}
    </YummyText>
    <YummyText className="text-xs text-gray-600 flex leading-relaxed">
      {description}
    </YummyText>
  </div>
);

const SmartRide = () => {
  const history = useHistory();
  const features = [
    {
      icon: (
        <img src="/strike.svg" alt="Instant Booking" className="w-8 h-8 text-green-600" />
      ),
      title: 'Instant Booking',
      description: 'Book a ride in seconds through our mobile app. Your ride will be assigned immediately and on their way to you.'
    },
    {
      icon: (
        <img src="/locationicon.svg" alt="Live Tracking" className="w-8 h-8 text-green-600" />
      ),
      title: 'Live Tracking',
      description: 'Track your rider in real-time on the map. Know exactly when they\'ll arrive at your pickup location.'
    },
    {
      icon: (
        <img src="/clockicon.svg" alt="Quick Delivery" className="w-8 h-8 text-green-600" />
      ),
      title: 'Quick Delivery',
      description: 'Our fleet of motorcycles and scooters navigate traffic efficiently, ensuring fast delivery times.'
    },
    {
      icon: (
        <img src="/dollaricon.svg" alt="Transparent Pricing" className="w-8 h-8 text-green-600" />
      ),
      title: 'Transparent Pricing',
      description: 'See the exact cost before you book. No hidden fees, no surprises. What you see is what you pay.'
    },
    {
      icon: (
        <img src="/shieldicon.svg" alt="Safe & Secure" className="w-8 h-8 text-green-600" />
      ),
      title: 'Safe & Secure',
      description: 'All riders are verified and trained. Your packages are insured and handled with care.'
    },
    {
      icon: (
        <img src="/peopleicon.svg" alt="Professional Riders" className="w-8 h-8 text-green-600" />
      ),
      title: 'Professional Riders',
      description: 'Our riders are experienced professionals who know the city inside out for optimal routes.'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Open the App',
      description: 'Launch the Swiftly app and enter your pickup and delivery locations.'
    },
    {
      number: 2,
      title: 'Choose Smart Ride',
      description: 'Select Smart Ride for fast motorcycle or scooter delivery.'
    },
    {
      number: 3,
      title: 'Confirm Booking',
      description: 'Review the price and confirm. A rider will be assigned instantly.'
    },
    {
      number: 4,
      title: 'Track & Receive',
      description: 'Track your package in real-time and receive it within minutes.'
    }
  ];

  return (
    <IonPage>
      <IonContent className="bg-[#f5f5f5] ion-no-padding fullscreen">
        {/* Navbar - moved inside IonContent */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
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
              onClick={() => { if (document && document.activeElement) document.activeElement.blur(); history.push('/auth/customer/signup'); }} 
              >
                <YummyText>Book a delivery</YummyText>
              </Button>
              <Button 
              variant="dark" 
              className="!px-2.5 !py-2 font-[100] text-[9px]"
              onClick={() => { if (document && document.activeElement) document.activeElement.blur(); history.push('/auth/role-select'); }}
              >
                <YummyText>Get Started</YummyText>
              </Button>
            </div>
          </PageWrapper>
        </div>
        
        {/* Hero Section */}
        <div className="relative w-full bg-[#00B75A] py-28 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute opacity-20">
              <img src="/despatch-rider.svg" alt="Background Pattern" className="w-full h-full object-contain" />
            </div>
          </div>

          <PageWrapper>
            <div className="relative text-center text-white py-12">
              <div className="flex items-center justify-center gap-3 mb-3">
                <img src="/toybike.svg" alt="Motorcycle Icon" className="w-10 h-10" />
                <YummyText className="text-medium font-[300] uppercase tracking-wider">
                  SMART RIDES
                </YummyText>
              </div>
              
              <YummyText className="text-5xl font-[300] !mb-4">
                Lightning-Fast Delivery on<br />Two Wheels
              </YummyText>
              
              <YummyText className="text-base font-[200] justify-center opacity-90 flex max-w-4xl mx-auto mt-2">
                Skip the traffic with our Smart Rides service. Motorcycles and scooters that zip through the city,<br />
                delivering your packages in record time.
              </YummyText>
            </div>
          </PageWrapper>
        </div>

        {/* Why Smart Rides Section */}
        <PageWrapper>
          <section className="py-20">
            <div className="text-center mb-16">
              <YummyText className="text-4xl font-[400] text-[#111827] mb-4">
                Why Smart Rides?
              </YummyText>
              <YummyText className="text-[#4B5563] flex !justify-center text-base font-[300] max-w-2xl mx-auto">
                Experience the future of urban delivery with our intelligent two-wheel fleet.
              </YummyText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-14">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-6 bg-[#F9FAFB] rounded-3xl mx-18">
            <div className="text-center mb-14">
              <YummyText className="text-5xl font-[300] text-[#111827]">
                How It Works
              </YummyText>
              <YummyText className="text-[#4B5563] flex items-center mt-2 justify-center text-base font-[300]">
                Getting started with Smart Rides is simple and quick
              </YummyText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 -mt-10 px-14">
              {steps.map((step, index) => (
                <StepCard
                  key={index}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </div>
          </section>
        </PageWrapper>

        {/* CTA Section */}
        <section className="relative w-full overflow-hidden">
          <div className="absolute inset-0 "></div>

          <div className="relative text-center text-[#1E1E1E] py-24 px-6 max-w-5xl mx-auto">
            <YummyText className="text-4xl font-[400] mb-6">
              Ready to Experience Fast Delivery?
            </YummyText>

            <YummyText className="mb-8 mt-2 text-sm font-[300] flex justify-center opacity-90">
              Download the Swiftly app today and get your first Smart Ride delivery at 20% off.
            </YummyText>

            <div className="flex justify-center gap-4">
              <div
                variant="light"
                className="!bg-[#00D68F] hover:!bg-[#149C46] !text-white !px-6 !py-3 rounded-lg transition-all duration-300"
              >
                <YummyText> Download App</YummyText>
              </div>

              <div
                variant="outline"
                className="!px-4 !py-3 !border-2 !border-[#1E1E1E] bg-white !text-gray-900 rounded-lg transition-all duration-300"
              >
                <YummyText>Contact Support</YummyText>
              </div>
            </div>
          </div>
        </section>

        <div className="-mt-6"></div>
        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default SmartRide;