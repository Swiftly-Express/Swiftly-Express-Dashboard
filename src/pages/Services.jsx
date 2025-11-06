import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import React from 'react';
import Button from '../components/Button';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ServiceCard = ({ imageSrc, title, desc, bullets }) => (
  <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-8 text-left flex flex-col items-start h-[360px] transition-all duration-300 hover:shadow-md hover:-translate-y-1">
    {/* Icon */}
    <div className="w-full flex justify-start mb-6">
      <img src={imageSrc} alt={title} className="w-11 h-11 object-contain" />
    </div>

    {/* Title & Description */}
    <div className="flex flex-col">
      <YummyText className="text-[#111827] text-2xl !font-sm mb-1 -mt-1">{title}</YummyText>
      <YummyText className="text-[#4A5563] text-sm leading-tighter">{desc}</YummyText>
    </div>

    {/* Bullet points */}
    <ul className="space-y-2 text-left text-sm text-[#4B5563] mt-3 leading-tight">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start">
          <span className="text-green-500 mr-2">✓</span>
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Services = () => {
  const services = [
    {
      title: 'Same Day Delivery',
      desc: 'Need it today? Our same-day delivery service ensures your packages are delivered within hours of pickup. Perfect for urgent documents, gifts, or business deliveries.',
      imageSrc: '/blockicon.svg',
      bullets: [
        'Pickup within 2 hours',
        'Delivery within 12 hours',
        'Real-time tracking',
        'SMS notifications'
      ]
    },
    {
      title: 'Next Day Delivery',
      desc: 'Our most popular service for non-urgent deliveries. Schedule a pickup today and receive your package tomorrow at a competitive rate.',
      imageSrc: '/vanicon.svg',
      bullets: [
        'Affordable pricing',
        'Guaranteed next-day arrival',
        'Package insurance included',
        'Evening delivery available'
      ]
    },
    {
      title: 'Scheduled Delivery',
      desc: 'Plan ahead with our scheduled delivery service. Choose your preferred pickup and delivery dates up to 30 days in advance.',
      imageSrc: '/clockicon.svg',
      bullets: [
        'Flexible scheduling',
        'Calendar integration',
        'Automatic reminders',
        'Volume discounts available'
      ]
    },
    {
      title: 'International Shipping',
      desc: 'Ship globally with confidence. We partner with major carriers to deliver your packages to over 50 countries worldwide.',
      imageSrc: '/planeicon.svg',
      bullets: [
        'Customs clearance assistance',
        'Door-to-door service',
        'International tracking',
        'Competitive rates'
      ]
    },
    {
      title: 'Secure Delivery',
      desc: 'Enhanced security for valuable items. All packages are tracked, insured up to $5,000, and require signatures on delivery.',
      imageSrc: '/shieldicon.svg',
      bullets: [
        'Enhanced security',
        'Signature required',
        'Photo proof of delivery',
        'Dedicated support'
      ]
    },
    {
      title: 'Business Solutions',
      desc: 'Tailored delivery solutions for businesses of all sizes, Volume discounts, API integration, and dedicated management.',
      imageSrc: '/peopleicon.svg',
      bullets: [
        'Volume discounts',
        'API integration',
        'Monthly billing',
        'Dedicated account manager'
      ]
    }
  ];

  const features = [
    {
      icon: '/locationicon.svg',
      title: 'Nationwide delivery',
      desc: 'Available in all 50 states'
    },
    {
      icon: '/shieldicon.svg',
      title: 'Fully insured',
      desc: 'All shipments up to $500'
    },
    {
      icon: '/clockicon.svg',
      title: 'On-Time Guarantee',
      desc: '95% on-time delivery rate'
    },
    {
      icon: '/staricon.svg',
      title: 'Rated 4.8/5',
      desc: 'Trusted by over 50,000 users'
    }
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
              <Button variant="primary" className="!px-3 !py-2 font-[100] text-[9px]">
                <YummyText>Book a delivery</YummyText>
              </Button>
              <Button variant="dark" className="!px-2.5 !py-2 font-[100] text-[9px]">
                <YummyText>Get Started</YummyText>
              </Button>
            </div>
          </PageWrapper>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-[#f5f5f5]">
        <PageWrapper>
          {/* Hero Section */}
          <section className="relative min-h-[calc(75vh-55px)] flex items-center justify-center left-16 gap-14 px-6 lg:px-20">
            {/* Left Content */}
            <div className="flex flex-col justify-center w-full max-w-md space-y-3">
              <YummyText className="text-4xl leading-snug font-sm text-[#111827]">
                Delivery Services for
                <br />
                Every Need
              </YummyText>

              <YummyText className="text-[#4A5563] text-base leading-6 !mt-3">
                From same-day express to international shipping, we've got
                <br /> you covered with reliable, affordable delivery solutions.
              </YummyText>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="!px-4 !py-3 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <YummyText className="font-[300] text-sm">Get Started</YummyText>
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="hidden lg:flex w-[35%] justify-center items-center relative">
              <img
                src="/drone.svg"
                alt="Drone Delivery"
                className="w-[300px] h-auto object-contain drop-shadow-lg"
              />
            </div>
          </section>


          {/* Services Section */}
          <section className="py-18 px-16 bg-[#FFFFFF] rounded-3xl">
            <div className="text-center mb-6">
              <YummyText className="text-3xl font-sm text-[#111827] mb-4">
                Our Services
              </YummyText>
              <YummyText className="text-[#6B7280] flex text-base items-center justify-center leading-relaxed">
                Choose from our comprehensive range of delivery services designed to
                <br /> meet your specific needs.
              </YummyText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <ServiceCard
                  key={index}
                  imageSrc={service.imageSrc}
                  title={service.title}
                  desc={service.desc}
                  bullets={service.bullets}
                />
              ))}
            </div>
          </section>

          {/* Why Choose Swiftly */}
          <section className="bg-[#1E1E1E] text-white rounded-2xl mt-10 mx-3 py-10">
            <div className="flex justify-center items-center">
              <YummyText className="text-[45px] font-[300] tracking-tight">
                Why Choose Swiftly?
              </YummyText>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 px-8 mt-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center text-center transition-all duration-300"
                >

                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#00D68F1A] mb-4">
                    <img
                      src={feature.icon}
                      alt={feature.title}
                      className="w-7 h-7  item-center "
                    />
                  </div>
                  <YummyText className="text-lg font-medium mb-2">
                    {feature.title}
                  </YummyText>
                  <YummyText className="text-sm text-gray-400 leading-snug">
                    {feature.desc}
                  </YummyText>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section
          <section className="relative w-full overflow-hidden mt-10">
             Full-width background image 
            <div className="absolute inset-0">
              <img
                src="/happylady.svg"
                alt="Happy Customer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-green-700/70 mix-blend-multiply"></div>
            </div>

             Centered Content 
            <div className="relative text-center text-white py-24 px-6 max-w-5xl mx-auto">
              <YummyText className="text-4xl font-semibold mb-4">
                Ready to Get Started?
              </YummyText>

              <YummyText className="mb-10 text-lg">
                Join thousands of satisfied customers who trust Swiftly for their
                delivery needs.
              </YummyText>

              <div className="flex justify-center gap-4">
                <Button
                  variant="light"
                  className="!bg-[#16A34A] hover:!bg-[#149C46] !text-white !px-6 !py-3 rounded-lg transition-all duration-300"
                >
                  <YummyText>Contact Us</YummyText>
                </Button>

                <Button
                  variant="outline"
                  className="!px-6 !py-3 !border-white !text-white hover:!bg-white hover:!text-green-700 rounded-lg transition-all duration-300"
                >
                  <YummyText>View Pricing</YummyText>
                </Button>
              </div>
            </div>
          </section> */}
        </PageWrapper>

        {/* CTA Section - Outside PageWrapper to allow full width */}
        <section className="relative w-full overflow-hidden mt-10">
          {/* Full-width background image */}
          <div className="absolute inset-0">
            <img
              src="/happylady.svg"
              alt="Happy Customer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-green-800/90 mix-blend-multiply"></div>
          </div>

          {/* Centered Content */}
          <div className="relative text-center text-white !py-20 px-6 max-w-5xl mx-auto">
            <YummyText className="text-3xl font-[300] mb-5">
              Ready to Get Started?
            </YummyText>

            <YummyText className="mb-2 flex text-lg font-[200] !items-center !justify-center leading-tight">
              Join thousands of satisfied customers who trust Swiftly for their <br />
              delivery needs.
            </YummyText>

            <div className="flex justify-center gap-4">
              <Button
                variant="light"
                className="!bg-[#16A34A] hover:!bg-[#149C46] !text-white !px-3 text-sm !py-2 rounded-lg transition-all duration-300"
              >
                <YummyText>Contact Us</YummyText>
              </Button>

              <Button
                variant="outline"
                className="!px-3 !py-2 !border-white text-sm bg-[#F9FAFB] !text-[#1E1E1E] hover:!bg-white hover:!text-green-700 rounded-lg transition-all duration-300"
              >
                <YummyText>View Pricing</YummyText>
              </Button>
            </div>
          </div>
        </section>
        <div className="mt-9"></div>
        {/* Footer */}     
          <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Services;
