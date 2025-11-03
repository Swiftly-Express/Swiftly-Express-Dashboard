import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import React, { useState } from 'react';
import Button from '../components/Button';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';
import HandDrawnSvg from '../components/HandDrawnSvg';
import { Zap, ShoppingBag, Truck, Briefcase, ChevronUp, ChevronDown } from 'lucide-react';

type Step = {
  title: string;
  description: string;
  image: string;
};

const steps: Step[] = [
  {
    title: 'Book',
    description: 'Schedule your pickup online or via our mobile app in just a few clicks Choose your service type andp delivery speed.',
    image: '/palmphone.svg',
  },
  {
    title: 'Track',
    description: 'Monitor your package in real-time with our advanced tracking system. Get updpate at every milestone of the journey.',
    image: '/laptopbox.svg',
  },
  {
    title: 'Deliver',
    description: 'Receive your package safely and on time. Get instant delivery confirmation with photo proof and signature.',
    image: '/humanbox.svg',
  },
];

const SwiftlyLanding = () => {
  const services = [
    {
      image: '/drone.svg',
      title: 'Express Delivery',
      description: 'Lightning-fast delivery within hours. Perfect for urgent packages and time-sensitive documents.',
    },
    {
      image: '/giftcard.svg',
      title: 'E-commerce Fulfillment',
      description: 'Complete fulfillment solutions for online stores. From secure warehousing to fast, reliable last-mile delivery service.',
    },
    {
      image: '/parachute.svg',
      title: 'Interstate Logistics',
      description: 'Reliable cross-country shipping with real-time tracking, full insurance, and guaranteed safety for total peace of mind.', 
    },
    {
      image: '/24hrs.svg',
      title: 'Corporate Delivery',
      description: 'Tailored logistics solutions for businesses. Bulk shipping, scheduled deliveries, and dedicated support.',
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How fast can I get a delivery?',
      answer:
        'Swiftly ensures deliveries within minutes depending on your location and distance. Most local deliveries arrive in less than 60 minutes.',
    },
    {
      question: 'Can I track my delivery in real-time?',
      answer:
        'Absolutely! You can track your delivery in real-time through the app. You’ll see your driver’s location and estimated arrival time.',
    },
    {
      question: 'Do you deliver outside my city?',
      answer:
        'We currently operate across major cities and are expanding rapidly. Check the app to see if we’re available in your area.',
    },
    {
      question: 'Is Swiftly available 24/7?',
      answer: 'Yes, we’re always on! Swiftly runs 24/7 so you can send or receive deliveries anytime, day or night.',
    },
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border -mb-6">
        <IonToolbar className="bg-white gap-10 -mb-3">
          <PageWrapper className="py-3 flex items-center justify-between">
            {/* Logo */}
            <YummyText className="text-3xl  px-3 font-sm text-black">
              Swiftly
            </YummyText>

            {/* Navbar */}
            <nav className="hidden md:flex gap-10 items-center -mr-16 text-base">
              <YummyText>
                <a href="#home" className="text-[#10b981] font-sm text-sm hover:text-[#059669] transition-colors">
                  Home
                </a>
              </YummyText>
              <YummyText>
                <a href="#services" className="text-gray-700 font-sm text-sm hover:text-black transition-colors">
                  Services
                </a>
              </YummyText>
              <YummyText>
                <a href="#how-it-works" className="text-gray-700 font-sm text-sm hover:text-black transition-colors">
                  How It Works
                </a>
              </YummyText>
              <YummyText>
                <a href="#smart-ride" className="text-gray-700 font-sm text-sm hover:text-black transition-colors">
                  Smart Ride
                </a>
              </YummyText>
              <YummyText>
                <a href="#contact" className="text-gray-700 font-sm text-sm hover:text-black transition-colors">
                  Contact
                </a>
              </YummyText>
            </nav>

            {/* Buttons */}
            <div className="flex items-center px-4 gap-3">
              <Button variant="primary" className="!px-3 !py-1 font-[100] text-[9px]">
                <YummyText>Book a delivery</YummyText>
              </Button>
              <Button variant="dark" className="!px-4 !py-1 font-[100] text-[9px]">
                <YummyText>Get Started</YummyText>
              </Button>
            </div>
          </PageWrapper>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-[#f5f5f5]">
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 -mt-16 text-center">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 -top-20 -bottom-5 pointer-events-none">
            <div className="relative w-full h-full">
              {/* White gradient overlay */}
              <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white via-white/100 to-transparent"></div>
              <img
                src="/bike.svg"
                alt="bike"
                className="w-full !max-w-12xl mx-auto object-contain"
                style={{
                  filter: 'drop-shadow(0 20px 36px rgba(0,0,0,0.08))'
                }}
              />
            </div>
          </div>

          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-[#d1fae5] border border-[#008C45] rounded-full px-3 py-1.5 z-10 -mt-20 mb-1">
            <div className="flex -space-x-2 mr-2">
              <img src="/roundcuthair.svg" alt="Customer 1" className="w-8 h-8 rounded-full bg-purple-600 object-cover" />
              <img src="/normalwig.svg" alt="Customer 2" className="w-8 h-8 rounded-full bg-rose-500  object-cover" />
              <img src="/lockedhair.svg" alt="Customer 3" className="w-8 h-8 rounded-full bg-amber-500 object-cover" />
              <img src="/afrowig.svg" alt="Customer 4" className="w-8 h-8 rounded-full bg-teal-600 object-cover" />
            </div>
            <YummyText className="text-[#059669] text-sm font-[300] whitespace-nowrap">
              Trusted by 10,000+ customers
            </YummyText>
          </div>

          {/* Main Heading */}
          <YummyText className="text-5xl font-sm leading-[1] mb-6 max-w-5xl text-black z-10">
            Delivering <span className="text-[#008C45]">Swiftly</span>,<br />
            Anywhere, Anytime
          </YummyText>

          {/* CTA Button */}
          <Button variant="dark" className="px-10 -mt-4 !py-2 text-xs font-[100] rounded-full z-10">
            <YummyText>Get app now</YummyText>
          </Button>
        </div>
        


        {/* Services Section */}
        <section className="py-20 bg-white">
          <PageWrapper className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex flex-col items-center text-center !mt-16 mb-8 space-y-1">
              <YummyText className="text-[#10b981] text-xs font-xs -mb-1">
                What we do best.
              </YummyText>
              <YummyText className="text-2xl font-medium text-black">
                Our Services
              </YummyText>
              <YummyText className="text-gray-600 text-sm font-sm max-w-2xl">
                Comprehensive logistics solutions designed to meet <br/> your every delivery need
              </YummyText>
            </div>

            {/* Services Grid */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 ml-3 mr-0.5 -mt-4">
              {services.map((service, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-4 py-2 shadow-lg border border-gray-100 flex flex-col"
                >
                  
                  <div className={`${service.bgColor} ${service.iconColor} w-11 h-11 rounded-lg flex items-center justify-center mt-3 mb-4`}>
                    {service.icon}
                  </div>

                  
                  <YummyText className="text-medium font-sm text-black mb-6">
                    {service.title}
                  </YummyText>

                  
                  <YummyText className="text-gray-600 text-sm font-[400] leading-relaxed -mt-2 mb-2">
                    {service.description}
                  </YummyText>
                </div>
              ))}
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-3 mr-0.5 -mt-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-[#1E1E1E] rounded-2xl p-5 text-left flex flex-col items-start h-[370px] relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at center, #1a1a1a, #0d0d0d)",
                  }}
                >
                  {/* Top content: title + description stacked tightly */}
                  <div className="flex flex-col">
                    <YummyText className="text-[#F9FAFB] text-base font-[300]">
                      {service.title}
                    </YummyText>
                    <YummyText className="text-[#E5E7EB] font-[300] text-[16px] leading-snug mt-2">
                      {service.description}
                    </YummyText>
                  </div>

                  {/* Illustration - occupy remaining space at bottom */}
                  <div className="mt-auto w-full flex justify-center">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="max-w-[220px] h-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </PageWrapper>
        </section>

        {/* No Hassle Section */}
        <section className="px-1 -mt-12 ml-3 mb-14">
          <PageWrapper className="max-w-7xl">
            <div className="relative rounded-xl overflow-hidden h-[430px] flex items-stretch">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(/lady.svg)',
                }}
                
              />

              {/* Dark gradient overlay */}
              {/* <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" /> */}

              {/* Content Layer */}
              <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between md:px-12">
                {/* Left Text Section */}
                <div className="flex flex-col justify-center text-left text-white max-w-full">
                  <YummyText className="text-5xl font-[700] leading-tight mb-3 -mt-12 -ml-3">
                    No Hassle. Just<br />Swiftly Am.
                  </YummyText>

                  {/* App Store Buttons */}
                  <div className="flex gap-2 -ml-3">
                    <div>
                      <a
                        href="https://play.google.com/store"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-42 h-42 mb-4"
                      >
                        <img
                          src="/playstore.svg"
                          alt="Get it on Google Play"
                          className="w-full h-full object-contain"
                        />
                      </a>
                    </div>
                    <div className="flex items-center">
                      <a
                        href="https://www.apple.com/app-store/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-37 h-37"
                      >
                        <img
                          src="applestore.svg"
                          alt="Download on the App Store"
                          className="w-full h-full object-contain"
                        />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Description Text */}
                <div className="hidden md:flex flex-col justify-center max-w-sm pr-4 -mr-6 text-right">
                  <YummyText className="text-white text-lg md:text-[18px] leading-relaxed font-light">
                    Swiftly makes delivery effortless — from pickup to drop-off, we
                    handle it all with speed and care.
                  </YummyText>
                </div>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* How It Works button */}
        <section className="-mt-10">
          <PageWrapper className="max-w-6xl mx-auto text-center">
            {/* Header */}
            <div className="flex flex-col items-center mb-14">
              <div className="flex justify-center mt-10">
                <YummyText className="px-6 py-1.5 bg-[#A7F3D0] text-[#00B75A] rounded-full text-xs font-[400]"
                >How It Works
                </YummyText>
              </div>
              <YummyText className="text-2xl font-semibold text-[#1E1E1E] mb-1">
                Three simple steps to get your <br/> package delivered
              </YummyText>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 -mt-8 mb-8 gap-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-[#111111] rounded-2xl p-8 text-left flex flex-col items-start h-[420px] relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at center, #1a1a1a, #0d0d0d)",
                  }}
                >
                  {/* Top content: title + description stacked tightly */}
                  <div className="flex flex-col">
                    <YummyText className="text-white text-3xxl font-sm">
                      {step.title}
                    </YummyText>
                    <YummyText className="text-gray-300 text-sm leading-tight mt-2">
                      {step.description}
                    </YummyText>
                  </div>

                  {/* Illustration - occupy remaining space at bottom */}
                  <div className="mt-auto w-full flex justify-center">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="max-w-[220px] h-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </PageWrapper>
        </section>
              
        {/* Testimonials Section */}
        <section className="relative py-20  overflow-hidden">
          {/* Carton Box - Left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none">
            <img
              src="/images/carton-box.png"
              alt="Carton Box"
              className="w-full h-full object-contain"
              style={{
                transform: 'translateX(-30%)',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
              }}
            />
          </div>

          {/* Carton Box - Right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none">
            <img
              src="/images/carton-box-2.png"
              alt="Carton Box"
              className="w-full h-full object-contain"
              style={{
                transform: 'translateX(30%) rotate(15deg)',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
              }}
            />
          </div>

          <PageWrapper className="max-w-5xl mx-auto relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-12 -mt-12">
              <YummyText className="px-6 py-1.5 bg-green-200 text-green-700 rounded-full text-xs font-[400] mb-1">
                Testimonials
              </YummyText>
              <YummyText className="text-3xl font-medium text-black mb-0.5">
                Results that speaks volumes
              </YummyText>
              <YummyText className="text-gray-600 text-[12.5px] -mb-12">
                Don't just take our word for it - hear from our satisfied clients
              </YummyText>
            </div>

            {/* Testimonial Card */}
            <div className="rounded-2xl p-12 -mt-8 text-center">
              <YummyText className="text-xl md:text-xl font-medium text-black leading-relaxed">
                Swiftly saved my day! My client needed documents<br />
                in less than an hour, and these guys showed up<br />
                sharp-sharp. Very reliable!
              </YummyText>

              {/* Customer Info */}
              <div className="flex flex-col items-center">
                <YummyText className="text-gray-700 text-sm mb-1 mt-3">
                  Chinonso Eze, <span className="text-[#10b981] font-medium">Lagos</span>
                </YummyText>
                
                {/* Hand-drawn style underline (now a reusable component) */}
                <HandDrawnSvg className="-mb-3 mr-0 -mt-2" />

                {/* Avatar Cluster */}
                <div className="flex items-center justify-center ml-4">
                  {/* Left avatars (comes first) */}
                  <div className="w-11 h-11 mr-2 -mb-3 rounded-full bg-gray-300 mt-8 border-2 border-white overflow-hidden">
                    <img src="/images/avatar-1.jpg" alt="Customer" className="w-full h-full object-cover" />
                  </div>

                  {/* left avatar (second) */}
                  <div className="w-11 h-11 mt-28 mb-3 -mr-4  rounded-full bg-gray-400 border-2 border-white overflow-hidden">
                    <img src="/images/avatar-2.jpg" alt="Customer" className="w-full h-full object-cover" />
                  </div>
                  
                  {/* central avatar(big icon)*/}
                  <div className="w-[75px] h-[75px] rounded-full bg-purple-200 border-2 border-[#10b981] overflow-hidden relative -ml-5 -mt-12 -mb-5 z-10">
                    <img src="/images/avatar-main.jpg" alt="Chinonso Eze" className="w-full h-full object-cover" />
                  </div>
                  

                  {/* Bottom avatars 3rd */}
                  <div className="w-11 h-11 rounded-full bg-gray-200 mt-[52%] -ml-8 border-2 border-white overflow-hidden -ml-1">
                    <img src="/images/avatar-3.jpg" alt="Customer" className="w-full h-full object-cover" />
                  </div>

                  {/* fianl image */}
                  <div className="w-11 h-11 rounded-full bg-gray-500 border-2 border-white overflow-hidden ml-1.5 mt-7">
                    <img src="/images/avatar-4.jpg" alt="Customer" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* FAQ Section */}
        <section className="bg-[#1a1a1a] py-20">
          <PageWrapper className="max-w-5xl mx-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-16 px-6 md:px-8">
              {/* Left Section - FAQ Text */}
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-[#10b981] font-medium text-lg mb-2">FAQs - Frequently asked questions</p>
                  <h2 className="text-4xl md:text-5xl font-bold mb-10 leading-tight">Got questions?</h2>
                </div>
      
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-700 rounded-2xl overflow-hidden bg-[#111]"
                    >
                      <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full flex justify-between items-center px-6 py-4 text-left focus:outline-none"
                      >
                        <span className="text-lg font-medium text-white">{faq.question}</span>
                        {openIndex === index ? (
                          <ChevronUp className="text-[#10b981] w-5 h-5" />
                        ) : (
                          <ChevronDown className="text-[#10b981] w-5 h-5" />
                        )}
                      </button>
      
                      {openIndex === index && (
                        <div className="px-6 pb-4 text-gray-400 text-base leading-relaxed">{faq.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
      
              {/* Right Section - Image */}
              <div className="flex-1 flex justify-center relative">
                <img
                  src="/images/green-delivery-box.png"
                  alt="Swiftly delivery box"
                  className="w-[300px] md:w-[420px] object-contain"
                />
              </div>
            </div>
          </PageWrapper>
        </section>      
      </IonContent>
    </IonPage>
  );
};

export default SwiftlyLanding;