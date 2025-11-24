import { IonPage, IonHeader, IonToolbar, IonContent } from '@ionic/react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '../components/Button';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { chevronDown } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

const ContactInfoCard = ({ icon, title, lines, subtext }) => (
  <div className="bg-white rounded-lg p-6 !px-5 border border-gray-200 text-left  duration-300">
    <div className="mb-4">
      <div className="w-12 h-12 rounded-full bg-[#00D68F1A] flex items-center justify-center">
        <img src={icon} alt={title} className="w-6 h-6" />
      </div>
    </div>
    <YummyText className="text-lg font-medium text-gray-900 mb-3">
      {title}
    </YummyText>
    <div className="space-y-1">
      {lines.map((line, index) => (
        <YummyText key={index} className="text-sm flex text-gray-600">
          {line}
        </YummyText>
      ))}
    </div>
    {subtext && (
      <YummyText className="text-xs text-gray-500 mt-3">
        {subtext}
      </YummyText>
    )}
  </div>
);

const FAQCard = ({ question, answer }) => (
  <div className="bg-white rounded-lg p-8 border border-gray-200">
    <YummyText className="text-lg font-medium text-gray-900 mb-3">
      {question}
    </YummyText>
    <YummyText className="text-sm text-gray-600 flex leading-relaxed">
      {answer}
    </YummyText>
  </div>
);

const Contact = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: '/telephone.svg',
      title: 'Phone',
      lines: ['+1 (555) 123-4567', '+1 (555) 765-4321'],
      subtext: 'Mon-Fri 9am-6pm'
    },
    {
      icon: '/mailicon.svg',
      title: 'Email',
      lines: ['support@swiftly.com', 'business@swiftly.com'],
      subtext: 'We respond within 24 hours'
    },
    {
      icon: '/clockicon.svg',
      title: 'Support Hours',
      lines: ['24/7 Emergency Support', 'Live Chat 9am-9pm'],
      subtext: 'Always here when you need us'
    }
  ];

  const faqs = [
    {
      question: 'What are your business hours?',
      answer: 'Our customer service is available 24/7 via phone and email. Office hours are Monday-Friday 9am-6pm, Saturday-Sunday 10am-4pm.'
    },
    {
      question: 'How quickly will I get a response?',
      answer: 'We typically respond to emails within 24 hours. Phone support is immediate during business hours.'
    },
    {
      question: 'Can I schedule a consultation?',
      answer: 'Yes! Business and Enterprise customers can schedule a free consultation with our team. Contact us to set up a meeting.'
    },
    {
      question: 'Do you have a live chat option?',
      answer: 'Yes, live chat is available on our website from 9am-9pm daily. Download our app for 24/7 chat support.'
    }
  ];

  return (
    <IonPage>
      <IonContent className="bg-[#f5f5f5] ion-no-padding">
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
        
        <PageWrapper>
          {/* Main Contact Section */}
          <section className="py-0 px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left - Contact Form */}
              <div className="bg-white rounded-2xl p-10">
                <YummyText className="text-4xl font-[400] text-[#111827] mb-3">
                  Get in Touch
                </YummyText>
                <YummyText className="text-sm flex text-[#4B5563] mb-4">
                  Have questions? We're here to help. Reach out to us and <br /> we'll respond as soon as possible.
                </YummyText>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-3 placeholder-[#717182] py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-[#F3F3F5]"
                      required
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-3 py-3 placeholder-[#717182] rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-[#F3F3F5]"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-3 placeholder-[#717182] rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-[#F3F3F5]"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        className="w-full appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-[#F3F3F5] text-gray-900"
                        style={{
                          color: formData.subject ? '#111827' : '#717182'
                        }}
                      >
                        <option value="" className="text-[#717182]">Select a subject</option>
                        <option value="general" className="text-gray-900">General Inquiry</option>
                        <option value="support" className="text-gray-900">Technical Support</option>
                        <option value="billing" className="text-gray-900">Billing Question</option>
                        <option value="partnership" className="text-gray-900">Partnership Opportunity</option>
                        <option value="feedback" className="text-gray-900">Feedback</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        <IonIcon icon={chevronDown} className="h-4 w-4 text-gray-500" />
                        
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      rows="5"
                      className="w-full px-3 py-3 placeholder-[#717182] rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-[#F3F3F5] resize-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    variant="primary"
                    className="!w-full !py-3 !bg-[#00D68F] hover:!bg-[#00B876] !text-white rounded-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <img src="/paper-plane.svg" alt="" className="w-5 h-5" />
                      <YummyText>Send Message</YummyText>
                    </div>
                  </Button>
                </form>
              </div>

              {/* Right - Map Placeholder */}
              <div className="bg-[#00D68F] rounded-2xl overflow-hidden mt-4 md:mt-6 lg:mt-4 !h-[92%] flex items-center justify-center">
              </div>
            </div>
          </section>

          {/* Contact Info Cards */}
          <section className="py-6 md:py-8 lg:py-6 px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactInfo.map((info, index) => (
                <ContactInfoCard
                  key={index}
                  icon={info.icon}
                  title={info.title}
                  lines={info.lines}
                  subtext={info.subtext}
                />
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-4 md:py-6 lg:py-4 px-32 bg-[#F9FAFB]">
            <div className="text-center mb-8">
              <YummyText className="text-4xl font-[300] text-[#111827] mb-4">
                Frequently Asked Questions
              </YummyText>
              <YummyText className="text-[#6B7280] flex justify-center text-base">
                Quick answers to common questions
              </YummyText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {faqs.map((faq, index) => (
                <FAQCard
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </section>
        </PageWrapper>

        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Contact;