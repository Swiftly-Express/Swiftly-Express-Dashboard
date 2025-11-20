import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { ChevronDown } from 'lucide-react';
import { YummyText } from '../../../components/YummyText';

const sideBottomShadow = {
  boxShadow: '2px 4px 4px rgba(0,0,0,0.06), -2px 4px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)'
};

const SupportCard = ({ icon, iconBg, title, subtitle, action, actionText }) => (
  <div className="bg-white rounded-2xl p-6 text-center" style={sideBottomShadow}>
    <YummyText>
    <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
      {icon}
    </div>
    <div className="text-base font-medium text-[#0F172A] mb-2">{title}</div>
    <div className="text-sm text-[#64748B] mb-2">{subtitle}</div>
    <button
      onClick={action}
      className="text-[#007BFF] font-medium text-sm hover:text-[#00B876] transition-colors"
    >
      {actionText}
    </button>
    </YummyText>
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
      <RiderLayout>
        <IonContent className="ion-padding">
          {/* Header */}
          <div className="mb-8">
            <YummyText>
            <div className="text-3xl font-medium text-[#0F172A] mb-2">
              Support Center
            </div>
            <div className="text-[#4A5565] text-[15px] font-[400]">
              We're here to help you with any questions
            </div>
            </YummyText>
          </div>

          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SupportCard
              icon={
                <img src="/telephoneicon.svg" alt="Phone Support" width="32" height="32" />
              }
              iconBg="bg-[#EFF6FF]"
              title="Phone Support"
              subtitle="Available 24/7"
              action={handlePhoneSupport}
              actionText="+1 (800) SWIFTLY"
            />

            <SupportCard
              icon={
                <img src="/envelope.svg" alt="Email Support" width="32" height="32" />
              }
              iconBg="bg-orange-50"
              title="Email Support"
              subtitle="Response within 2 hours"
              action={handleEmailSupport}
              actionText="support@swiftlyexpress.com"
            />

            <SupportCard
              icon={
                <img src="/chaticon.svg" alt="Live Chat" width="32" height="32" />
              }
              iconBg="bg-[#F0FDF4]"
              title="Live Chat"
              subtitle="Instant assistance"
              action={handleLiveChat}
              actionText="Start Chat"
            />
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-100" style={sideBottomShadow}>
            <div className="mb-6">
              <YummyText>
              <div className="text-xl font-normal text-[#0F172A] mb-1">
                Send us a Message
              </div>
              <div className="text-sm text-[#64748B]">
                Fill out the form below and we'll get back to you soon
              </div>
              </YummyText>
            </div>

            <form onSubmit={handleSubmit}>
              <YummyText>
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
              </YummyText>
            </form>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl p-6 mb-12" style={sideBottomShadow}>
            <div className="mb-6">
              <div className="flex items-center mb-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-start">
                  <img src="/questionmark-outline.svg" alt="FAQ Icon" width="24" height="24" />
                </div>
                <YummyText>
                  <div className="text-lg font-normal text-[#0F172A]">
                    Frequently Asked Questions
                  </div>
                </YummyText>
              </div>
              <YummyText>
                <div className="text-lg font-sm text-[#0F172A]">
                  Quick answers to common questions
                </div>
              </YummyText>
            </div>

            
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                
                <div
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <YummyText>
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
                  </YummyText>
                </div>
              ))}
            </div>
          </div>
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default Support;