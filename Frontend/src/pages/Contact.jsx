import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Fish, Users, MessageCircle, Headphones } from 'lucide-react';
import Footer from '../components/home/Footer';
import { API_URL } from '../config';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    userType: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`${API_URL}/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            name: '',
            email: '',
            subject: '',
            userType: '',
            message: ''
          });
        }, 3000);
      } else {
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setErrorMessage('Failed to send message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6 text-blue-600" />,
      title: "Address",
      details: [
        "Institute of Technology",
        "University of Moratuwa",
        "Homagama, Sri Lanka"
      ]
    },
    {
      icon: <Mail className="w-6 h-6 text-green-600" />,
      title: "Email",
      details: [
        "aqualink.demo@gmail.com"
      ]
    },
    {
      icon: <Phone className="w-6 h-6 text-purple-600" />,
      title: "Phone",
      details: [
        "+94 78 436 7410"
      ]
    }
  ];

  const userTypes = [
    "Farm Owner (Breeder/Grower)",
    "Shop Owner",
    "Retail Buyer",
    "Exporter",
    "Delivery Person",
    "Service Provider",
    "Industrial Stuff Seller",
    "Other"
  ];

  const supportCategories = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Account Support",
      description: "Help with registration, profile verification, and account management"
    },
    {
      icon: <Fish className="w-8 h-8 text-green-600" />,
      title: "Listing & Orders",
      description: "Assistance with fish listings, order placement, and transaction issues"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-purple-600" />,
      title: "Platform Navigation",
      description: "Guidance on using AQUALINK features and platform functionality"
    },
    {
      icon: <Headphones className="w-8 h-8 text-orange-600" />,
      title: "Technical Support",
      description: "Help with technical issues, bugs, and platform performance"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <Mail className="w-12 h-12" />
              Contact Us
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Get in touch with the AQUALINK team. We're here to help you succeed in the ornamental fish industry.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Support Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">How Can We Help You?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h2>
            
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for contacting us. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Type
                    </label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select your role</option>
                      {userTypes.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide details about your inquiry, including any specific questions or issues you're experiencing..."
                  ></textarea>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{info.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{info.title}</h3>
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-gray-600 mb-1">{detail}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;