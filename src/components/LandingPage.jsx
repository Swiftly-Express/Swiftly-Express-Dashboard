import {
  IonPage,
  IonContent,
  useIonRouter,
} from "@ionic/react";
import { useState } from "react";
import Button from "./Button";
import PageWrapper from "./PageWrapper";
import { YummyText } from "./YummyText";
import HandDrawnSvg from "./HandDrawnSvg";
import Navbar from "./Navbar";
import StoreButtons from "./StoreButtons";
import { ChevronUp, ChevronDown } from "lucide-react";

const steps = [
  {
    title: "Book",
    description:
      "Schedule your pickup online or via our mobile app in just a few clicks Choose your service type andp delivery speed.",
    image: "/palmphone.svg",
  },
  {
    title: "Track",
    description:
      "Monitor your package in real-time with our advanced tracking system. Get updpate at every milestone of the journey.",
    image: "/laptopbox.svg",
  },
  {
    title: "Deliver",
    description:
      "Receive your package safely and on time. Get instant delivery confirmation with photo proof and signature.",
    image: "/humanbox.svg",
  },
];

const SwiftlyLanding = () => {
  const router = useIonRouter();
  const services = [
    {
      image: "/drone.svg",
      title: "Express Delivery",
      description:
        "Lightning-fast delivery within hours. Perfect for urgent packages and time-sensitive documents.",
    },
    {
      image: "/giftcard.svg",
      title: "E-commerce Fulfillment",
      description:
        "Complete fulfillment solutions for online stores. From secure warehousing to fast, reliable last-mile delivery service.",
    },
    {
      image: "/parachute.svg",
      title: "Interstate Logistics",
      description:
        "Reliable cross-country shipping with real-time tracking, full insurance, and guaranteed safety for total peace of mind.",
    },
    {
      image: "/24hrs.svg",
      title: "Corporate Delivery",
      description:
        "Tailored logistics solutions for businesses. Bulk shipping, scheduled deliveries, and dedicated support.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How fast can I get a delivery?",
      answer:
        "Swiftly ensures deliveries within minutes depending on your location and distance. Most local deliveries arrive in less than 60 minutes.",
    },
    {
      question: "Can I track my delivery in real-time?",
      answer:
        "Absolutely! You can track your delivery in real-time through the app. You’ll see your driver’s location and estimated arrival time.",
    },
    {
      question: "Do you deliver outside my city?",
      answer:
        "We currently operate across major cities and are expanding rapidly. Check the app to see if we’re available in your area.",
    },
    {
      question: "Is Swiftly available 24/7?",
      answer:
        "Yes, we’re always on! Swiftly runs 24/7 so you can send or receive deliveries anytime, day or night.",
    },
    {
      question: "Is Swiftly available 24/7?",
      answer:
        "Yes, we’re always on! Swiftly runs 24/7 so you can send or receive deliveries anytime, day or night.",
    },
  ];

  return (
    <IonPage>
      <IonContent className="bg-[#f5f5f5] !fullscreen min-h-screen">
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
                className="!px-4 !py-3 text-medium font-[300] text-[10px]"
                onClick={() => {
                  if (document && document.activeElement)
                    document.activeElement.blur();
                  router.push("/auth/customer/signup");
                }}
              >
                <YummyText>Book a delivery</YummyText>
              </Button>
              <Button
                variant="dark"
                className="!px-4 text-medium !py-3 font-[300] text-[10px]"
                onClick={() => {
                  if (document && document.activeElement)
                    document.activeElement.blur();
                  router.push("/auth/role-select");
                }}
              >
                <YummyText>Get Started</YummyText>
              </Button>
            </div>
          </PageWrapper>
        </div>
        
        {/* Hero Section */}
        <div className="relative flex flex-col items-center justify-center h-screen px-4 text-center">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 h-full pointer-events-none -z-10">
            <div className="relative w-full h-full">
              {/* White gradient overlay */}
              <div className="absolute inset-0 bottom-auto h-[calc(60%+2.5rem)] z-[1] bg-gradient-to-b from-white via-white/100 to-transparent" />
              <img
                src="/bike.svg"
                alt="bike"
                className="w-full h-full object-cover object-bottom !max-w-12xl mx-auto"
                style={{
                  filter: "drop-shadow(0 20px 36px rgba(0,0,0,0.08))",
                }}
              />
            </div>
          </div>

          <div className="-translate-y-[80%]">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-[#d1fae5] border border-[#008C45] rounded-full px-3 py-1.5 z-10 mb-1">
              <div className="flex -space-x-2 mr-2">
                <img
                  src="/roundcuthair.svg"
                  alt="Customer 1"
                  className="w-8 h-8 rounded-full bg-purple-600 object-cover"
                />
                <img
                  src="/normalwig.svg"
                  alt="Customer 2"
                  className="w-8 h-8 rounded-full bg-rose-500  object-cover"
                />
                <img
                  src="/lockedhair.svg"
                  alt="Customer 3"
                  className="w-8 h-8 rounded-full bg-amber-500 object-cover"
                />
                <img
                  src="/afrowig.svg"
                  alt="Customer 4"
                  className="w-8 h-8 rounded-full bg-teal-600 object-cover"
                />
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
            <div className="flex justify-center mt-4">
              <div className="group relative inline-block">
                <Button
                  variant="dark"
                  className="relative px-10 !py-4 text-sm font-[300] rounded-full z-10 overflow-hidden transition-all !duration-[2000ms] ease-out group-hover:px-16"
                  onClick={() => {
                    if (document && document.activeElement)
                      document.activeElement.blur();
                    history.push("/auth/role-select");
                  }}
                >
                  <div className="flex items-center justify-center duration-2000 transition-all ease-out">
                    {/* Icons Container - Slides in from left */}
                    <div className="flex items-center absolute left-6 top-1/2 -translate-y-1/2 opacity-0 -translate-x-4 transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:translate-x-0">
                      {/* App Store Icon */}
                      <div className="w-7 h-7 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                      </div>

                      {/* Google Play Icon */}
                      <div className="w-7 h-7 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Text - Stays centered, slides slightly right on hover */}
                    <div className="overflow-hidden text-nowrap relative">
                      {/* Default Text */}
                      <YummyText
                        className="transition-all duration-500 ease-out group-hover:opacity-0 group-hover:translate-x-4"
                      >
                        Get app now
                      </YummyText>

                      {/* Hover Text */}
                      <YummyText
                        className="absolute text-nowrap flex inset-0 items-center !justify-center opacity-0 -translate-x-6 transition-all duration-1000 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-hover:pl-4"
                      >
                        Store Download
                      </YummyText>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <section className="bg-white">
          <PageWrapper className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex flex-col items-center text-center mb-8 space-y-1">
              <YummyText className="text-[#10b981] text-xs font-xs -mb-1">
                What we do best.
              </YummyText>
              <YummyText className="text-2xl font-medium text-black">
                Our Services
              </YummyText>
              <YummyText className="text-gray-600 text-sm font-sm max-w-2xl">
                Comprehensive logistics solutions designed to meet <br /> your
                every delivery need
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-3 mr-0.5 -mt-4 px-3">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-[#1E1E1E] rounded-3xl p-5 text-left flex flex-col items-start h-[370px] relative overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at center, #1a1a1a, #0d0d0d)",
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
        <section className="px-4 mt-4 md:mt-6 lg:mt-4 mb-6 md:mb-8 lg:mb-6">
          <PageWrapper className="max-w-7xl">
            <div className="relative rounded-3xl overflow-hidden  h-[430px] flex items-center">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover opacity-100 bg-center"
                style={{
                  backgroundImage: "url(/lady.svg)",
                }}
              />

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5" />

              {/* Content Layer */}
              <div className="relative z-10 w-full flex flex-row items-center justify-between md:px-11">
                {/* Left Text Section */}
                <div className="flex flex-col justify-center text-left text-white max-w-full">
                  <YummyText className="text-5xl font-[600] leading-tight mb-3 -mt-12 -ml-3">
                    No Hassle. Just
                    <br />
                    Swiftly Am.
                  </YummyText>

                  {/* App Store Buttons */}
                  <StoreButtons className="-ml-3" />
                </div>

                {/* Right Description Text */}
                <div className="hidden md:flex flex-col justify-center max-w-sm pr-4 -mr-6 text-right">
                  <YummyText className="text-white text-lg md:text-[18px] leading-relaxed font-light">
                    Swiftly makes delivery effortless — from pickup to drop-off,
                    we handle it all with speed and care.
                  </YummyText>
                </div>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* How It Works button */}
        <section className="-mt-4 md:-mt-6 lg:-mt-4">
          <PageWrapper className="max-w-6xl mx-auto text-center">
            {/* Header */}
            <div className="flex flex-col items-center mb-6 md:mb-8 lg:mb-6">
              <div className="flex justify-center mt-4 md:mt-6 lg:mt-4">
                <YummyText className="px-6 py-1.5 bg-[#A7F3D0] text-[#00B75A] rounded-full text-xs font-[400]">
                  How It Works
                </YummyText>
              </div>
              <YummyText className="text-4xl font-semibold text-[#1E1E1E] mb-1">
                Three simple steps to get your <br /> package delivered
              </YummyText>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 ml-3.5 -mt-6 md:-mt-7 lg:-mt-6 mb-4 md:mb-5 lg:mb-4 px-3 mx-2 gap-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-[#1E1E1E] !rounded-3xl p-14 px-12 h-[410px] text-left flex flex-col items-start  relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "url(/doublecircle.svg) background: #D9D9D9 w-[40%]",
                  }}
                >
                  {/* Top content: title + description stacked tightly */}
                  <div className="flex flex-col">
                    <YummyText className="text-[#F9FAFB] text-3xl font-sm">
                      {step.title}
                    </YummyText>
                    <YummyText className="text-[#E5E7EB] text-sm font-[200] leading-snug mt-2">
                      {step.description}
                    </YummyText>
                  </div>

                  {/* Illustration - occupy remaining space at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 w-full flex justify-center pb-0">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full max-w-[240px] h-auto object-contain"
                      style={{
                        maxHeight: "220px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PageWrapper>
        </section>

        {/* Testimonials Section */}
        <section className="relative py-8 md:py-12 lg:py-8 overflow-hidden">
          {/* Carton Box - Left */}
          <div className="absolute left-8 top-80 mt-3 -translate-y-1/2 w-60 h-60 pointer-events-none">
            <img
              src="/cartonback.svg"
              alt="Carton Box"
              className="w-full h-full object-contain"
              style={{
                transform: "translateX(-30%)",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))",
              }}
            />
          </div>

          {/* Carton Box - Right */}
          <div className="absolute right-14 top-24 z-20 -translate-y-1/2 w-60 h-60 pointer-events-none">
            <img
              src="/carton.svg"
              alt="Carton Box"
              className="w-full h-full object-contain"
              style={{
                transform: "translateX(30%) rotate(1deg)",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))",
              }}
            />
          </div>

          <PageWrapper className="max-w-5xl mx-auto relative -mb-8 z-10">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-12 -mt-12">
              <YummyText className="px-6 py-1.5 bg-green-200 text-green-700 rounded-full text-xs font-[400] mb-1">
                Testimonials
              </YummyText>
              <YummyText className="text-3xl font-medium text-black mb-0.5">
                Results that speaks volumes
              </YummyText>
              <YummyText className="text-gray-600 text-[12.5px] -mb-12">
                Don't just take our word for it - hear from our satisfied
                clients
              </YummyText>
            </div>

            {/* Testimonial Card */}
            <div className="rounded-2xl text-center max-w-2xl mx-auto">
              <YummyText className="text-xl md:text-xl font-medium text-black leading-relaxed">
                Swiftly saved my day! My client needed documents
                <br />
                in less than an hour, and these guys showed up
                <br />
                sharp-sharp. Very reliable!
              </YummyText>

              {/* Customer Info */}
              <div className="flex flex-col items-center">
                <YummyText className="text-gray-700 text-sm mb-1 mt-3">
                  Chinonso Eze,{" "}
                  <span className="text-[#10b981] font-medium">Lagos</span>
                </YummyText>

                {/* Hand-drawn style underline (now a reusable component) */}
                <HandDrawnSvg />

                {/* Avatar Cluster */}
                <div className="flex items-center justify-center">
                  {/* Left avatars (comes first) */}
                  <div className="w-11 h-11 mr-2 -mb-3 rounded-full bg-gray-300 mt-8 border-2 border-white overflow-hidden">
                    <img
                      src="/lockedhair.svg"
                      alt="Customer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* left avatar (second) */}
                  <div className="w-11 h-11 mt-28 mb-3 -mr-4  rounded-full bg-gray-400 border-2 border-white overflow-hidden opacity-30">
                    <img
                      src="/normalwig.svg"
                      alt="Customer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* central avatar(big icon)*/}
                  <div className="w-[75px] h-[75px] rounded-full bg-purple-200 border-2 border-[#10b981] overflow-hidden relative -ml-5 -mt-12 -mb-5 z-10">
                    <img
                      src="/lockedhair.svg"
                      alt="Chinonso Eze"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Bottom avatars 3rd */}
                  <div className="w-11 h-11 rounded-full bg-gray-200 mt-[52%] -ml-8 border-2 border-white overflow-hidden opacity-30 -ml-1">
                    <img
                      src="/roundcuthair.svg"
                      alt="Customer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* fianl image */}
                  <div className="w-11 h-11 rounded-full bg-gray-500 border-2 border-white overflow-hidden opacity-30 ml-1.5 mt-9">
                    <img
                      src="/afrowig.svg"
                      alt="Customer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* FAQ Section */}
        <section className="bg-[#1a1a1a] h-auto relative overflow-hidden">
          <PageWrapper className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-6">
              {/* Left Section - FAQ Text */}
              <div className="space-y-6">
                <div className="flex flex-col">
                  <YummyText className="text-[#10b981] font-[400] text-sm mb-4 mt-12 py-10">
                    FAQs - Frequently asked questions
                  </YummyText>
                  <YummyText className="text-4xl text-[#F9FAFB] font-medium leading-tight -mt-14 mb-6">
                    Got questions?
                  </YummyText>
                  <YummyText className="text-sm text-[#F9FAFB] font-[300] mb-18 -mt-6">
                    Here are a few things people always ask — and our <br />{" "}
                    answers to them
                  </YummyText>
                </div>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-[#F9FAFB] rounded-lg overflow-hidden bg-[#1a1a1a]"
                    >
                      <button
                        onClick={() =>
                          setOpenIndex(openIndex === index ? null : index)
                        }
                        className="w-full flex justify-between items-center px-5 py-3 text-left focus:outline-none hover:bg-[#222] transition-colors"
                      >
                        <YummyText className="text-base font-[300] text-[#10b981]">
                          {faq.question}
                        </YummyText>
                        {openIndex === index ? (
                          <ChevronUp className="text-[#10b981] w-5 h-5 flex-shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="text-[#10b981] w-5 h-5 flex-shrink-0 ml-4" />
                        )}
                      </button>

                      {openIndex === index && (
                        <div className="px-5 pb-4">
                          <YummyText className="text-gray-400 text-sm font-[300] leading-relaxed">
                            {faq.answer}
                          </YummyText>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Section - Image (Fixed position) */}
              <div className="hidden md:flex items-end justify-center">
                <div className="sticky top-20">
                  <img
                    src="/deliverybike.svg"
                    alt="Delivery Bike"
                    className="w-[5200px] object-contain"
                  />
                </div>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* Download App & Quote Section */}
        <section className="bg-white py-10">
          <PageWrapper className="max-w-6xl mx-auto px-20">
            <div className="grid grid-cols-2 w-[106%] h-[668px] gap-4 -ml-7">
              {/* Download App Card */}
              <div className="bg-[#1a1a1a] rounded-3xl p-14 relative overflow-hidden">
                <div className="relative z-10 -mt-5">
                  <YummyText className="text-white text-5xl font-[300] mb-4 leading-tight">
                    Download Our
                    <br />
                    Mobile App
                  </YummyText>
                  <YummyText className="text-[#FFEDD4] flex text-sm font-[300] mb-6 max-w-xs mt-4 leading-relaxed">
                    Book deliveries, track packages, and manage your shipments
                    on the go. Available for iOS and Android.
                  </YummyText>

                  {/* App Store Buttons */}
                  <StoreButtons />
                </div>

                {/* Illustration */}
                <div className="absolute bottom-0 right-0 w-full">
                  <img
                    src="/orderbox.svg"
                    alt="Mobile App"
                    className="w-full object-contain"
                  />
                </div>
              </div>

              {/* Get Quote Card */}
              <div className="bg-[#10b981] rounded-3xl p-10 relative overflow-hidden">
                <div className="relative z-10">
                  <YummyText className="text-white text-5xl font-[300] mb-4 leading-tight">
                    Get a Free
                    <br />
                    Quote
                  </YummyText>
                  <YummyText className="text-[#FFEDD4] flex text-sm font-[300] mb-6 max-w-xs mt-4 leading-relaxed">
                    Need a custom logistics solution? Contact us for a
                    personalized quote tailored to your business needs.
                  </YummyText>

                  <Button
                    variant="light"
                    className="!bg-white !text-[#10b981] hover:!bg-gray-100 !px-5 !py-2.5 !rounded-full"
                    onClick={() => {
                      if (document && document.activeElement)
                        document.activeElement.blur();
                      history.push("/auth/customer/signup");
                    }}
                  >
                    <YummyText className="font-[400] text-[#001900] text-xs">
                      Book a delivery
                    </YummyText>
                  </Button>
                </div>

                <div className="absolute bottom-0 right-9 w-[70%] h-[200px]">
                  {/* quotes.svg underneath (yellow folder) */}
                  <img
                    src="/quotes.svg"
                    alt="Quotes"
                    className="w-full h-full object-contain absolute bottom-0 left-32"
                  />

                  {/* quotation.svg on top (paper) */}
                  <img
                    src="/quotation.svg"
                    alt="Quotation"
                    className="w-[85%] h-auto object-contain absolute bottom-0 left-16 z-10"
                  />
                </div>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* Footer */}
        <footer className="bg-[#111111] text-white py-12">
          <PageWrapper className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
              {/* Company Info */}
              <div>
                <YummyText className="text-2xl font-medium mb-4">
                  Swiftly Express
                </YummyText>
                <YummyText className="flex text-gray-400 text-sm font-[300] leading-relaxed mb-6">
                  Your trusted logistics partner delivering excellence across
                  the nation with speed, security, and reliability.
                </YummyText>

                {/* Social Icons */}
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#10b981] transition-colors"
                  >
                    <span className="text-lg">f</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#10b981] transition-colors"
                  >
                    <span className="text-lg">𝕏</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#10b981] transition-colors"
                  >
                    <span className="text-lg">in</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:bg-[#10b981] transition-colors"
                  >
                    <span className="text-lg">📷</span>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <YummyText className="text-lg font-medium mb-4">
                  Quick Links
                </YummyText>
                <ul className="space-y-3">
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/about");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      About Us
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/services");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Our Services
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/smart-ride");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Smart Ride
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/track-package");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Track Package
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/careers");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Careers
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/blog");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Blog
                    </span>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <YummyText className="text-lg font-medium mb-4">
                  Services
                </YummyText>
                <ul className="space-y-3">
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/services");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Express Delivery
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/services");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      E-commerce Fulfillment
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/services");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Interstate Logistics
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/services");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Corporate Delivery
                    </span>
                  </li>
                  <li>
                    <span
                      onClick={() => {
                        if (document && document.activeElement)
                          document.activeElement.blur();
                        history.push("/services");
                      }}
                      className="text-gray-400 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                    >
                      Same-Day Delivery
                    </span>
                  </li>
                </ul>
              </div>

              {/* Contact Us */}
              <div>
                <YummyText className="text-lg font-medium mb-4">
                  Contact Us
                </YummyText>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-[#10b981] mt-1">📍</span>
                    <YummyText className="text-gray-400 text-sm font-[300]">
                      123 Logistics Avenue, Suite 100
                    </YummyText>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#10b981] mt-1">📞</span>
                    <YummyText className="text-gray-400 text-sm font-[300]">
                      +1 (800) SWIFTLY
                    </YummyText>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#10b981] mt-1">✉️</span>
                    <YummyText className="text-gray-400 text-sm font-[300]">
                      support@swiftlyexpress.com
                    </YummyText>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <YummyText className="text-gray-500 text-sm font-[300]">
                © 2025 Swiftly Express. All rights reserved.
              </YummyText>
              <div className="flex gap-6">
                <span
                  onClick={() => {
                    if (document && document.activeElement)
                      document.activeElement.blur();
                    history.push("/privacy-policy");
                  }}
                  className="text-gray-500 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </span>
                <span
                  onClick={() => {
                    if (document && document.activeElement)
                      document.activeElement.blur();
                    history.push("/terms-of-service");
                  }}
                  className="text-gray-500 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                >
                  Terms of Service
                </span>
                <span
                  onClick={() => {
                    if (document && document.activeElement)
                      document.activeElement.blur();
                    history.push("/cookie-policy");
                  }}
                  className="text-gray-500 hover:text-[#10b981] text-sm font-[300] transition-colors cursor-pointer"
                >
                  Cookie Policy
                </span>
              </div>
            </div>
          </PageWrapper>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default SwiftlyLanding;
