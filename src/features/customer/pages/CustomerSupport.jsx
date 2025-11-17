import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import CustomerLayout from '../components/CustomerLayout';
import { ChevronDown } from 'lucide-react';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const SupportCard = ({ icon, iconBg, title, subtitle, action, actionText }) => (
  <div className="bg-white rounded-2xl p-6 text-center" style={sideBottomShadow}>
    <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
      {icon}
    </div>
    <div className="text-base font-medium text-[#0F172A] mb-2">{title}</div>
    <div className="text-sm text-[#64748B] mb-4">{subtitle}</div>
    <button
      onClick={action}
      className="text-[#00D68F] font-medium text-sm hover:text-[#00B876] transition-colors"
    >
      {actionText}
    </button>
  </div>
);

const Support = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      question: 'How do I track my delivery?',
      answer: 'You can track your delivery in real-time through the Active Deliveries page. Simply click on any active order to see the live location of your package and estimated arrival time.'
    },
    {
      question: 'What are the delivery time frames?',
      answer: 'We offer multiple delivery options: Express (1-3 hours), Same-day (within 24 hours), and Standard (2-5 business days). The exact timeframe depends on your location and the service selected.'
    },
    {
      question: 'How is the delivery cost calculated?',
      answer: 'Delivery cost is calculated based on distance, package size, delivery speed, and current demand. You can see the exact cost before accepting any delivery order.'
    },
    {
      question: 'Can I reschedule a delivery?',
      answer: 'Yes, you can reschedule a delivery before it has been picked up. Contact the customer through the app or reach out to support for assistance with rescheduling.'
    },
    {
      question: 'What items are prohibited for shipping?',
      answer: 'Prohibited items include hazardous materials, illegal substances, weapons, live animals, and perishable items without proper packaging. Always check the package contents before accepting.'
    },
    {
      question: 'Is my package insured?',
      answer: 'Yes, all packages are automatically insured up to $100. Additional insurance can be purchased for high-value items. Coverage details are available in your rider agreement.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
    alert('Message sent! We\'ll get back to you soon.');
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const handlePhoneSupport = () => {
    window.location.href = 'tel:+18005943589'; // +1 (800) SWIFTLY
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:support@swiftlyexpress.com';
  };

  const handleLiveChat = () => {
    // Implement live chat functionality
    alert('Live chat will open here');
  };

  return (
    <IonPage>
      <CustomerLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8">
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Support Center
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              We're here to help you with any questions
            </div>
          </div>

          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SupportCard
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#00D68F"/>
                </svg>
              }
              iconBg="bg-green-50"
              title="Phone Support"
              subtitle="Available 24/7"
              action={handlePhoneSupport}
              actionText="+1 (800) SWIFTLY"
            />

            <SupportCard
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#F59E0B"/>
                </svg>
              }
              iconBg="bg-orange-50"
              title="Email Support"
              subtitle="Response within 2 hours"
              action={handleEmailSupport}
              actionText="support@swiftlyexpress.com"
            />

            <SupportCard
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" fill="#00D68F"/>
                </svg>
              }
              iconBg="bg-green-50"
              title="Live Chat"
              subtitle="Instant assistance"
              action={handleLiveChat}
              actionText="Start Chat"
            />
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100" style={sideBottomShadow}>
            <div className="mb-6">
              <div className="text-xl font-normal text-[#0F172A] mb-1">
                Send us a Message
              </div>
              <div className="text-sm text-[#64748B]">
                Fill out the form below and we'll get back to you soon
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F172A] mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#0F172A] mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00D68F]"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm text-[#0F172A] mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="How can we help?"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00D68F]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm text-[#0F172A] mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Describe your issue or question in detail..."
                    required
                    rows="6"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00D68F] resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="bg-[#00B75A] hover:bg-[#00B876] text-white px-6 py-3 rounded-xl transition-colors font-[300]"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100" style={sideBottomShadow}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="#00D68F"/>
                </svg>
              </div>
              <div>
                <div className="text-xl font-normal text-[#0F172A]">
                  Frequently Asked Questions
                </div>
                <div className="text-sm text-[#64748B]">
                  Quick answers to common questions
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base font-normal text-[#0F172A]">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#64748B] transition-transform ${
                        openIndex === index ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openIndex === index && (
                    <div className="px-5 pb-4 pt-2">
                      <p className="text-sm text-[#64748B] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </IonContent>
      </CustomerLayout>
    </IonPage>
  );
};

export default Support;