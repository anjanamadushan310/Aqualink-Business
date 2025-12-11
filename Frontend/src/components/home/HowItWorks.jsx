import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  TruckIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  StarIcon,
  PhoneIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const HowItWorks = () => {
  const navigate = useNavigate();
  const buyerSteps = [
    {
      icon: MagnifyingGlassIcon,
      title: 'Browse Products',
      description: 'Search through our verified listings of fish, equipment, and services'
    },
    {
      icon: ShoppingCartIcon,
      title: 'Place Order',
      description: 'Select products, communicate with sellers, and make secure purchases'
    },
    {
      icon: TruckIcon,
      title: 'Receive Delivery',
      description: 'Get your order delivered or coordinate pickup with the seller'
    }
  ];

  const sellerSteps = [
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Register & Verify',
      description: 'Create your account and complete verification process'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'List Products',
      description: 'Add your fish, equipment, or services with details and images'
    },
    {
      icon: TruckIcon,
      title: 'Sell & Deliver',
      description: 'Receive orders, connect with buyers, and grow your business'
    }
  ];

  const trustFeatures = [
    {
      icon: ShieldCheckIcon,
      title: 'Verification',
      description: 'All sellers go through our verification process for authenticity'
    },
    {
      icon: StarIcon,
      title: 'Reviews & Ratings',
      description: 'Transparent feedback system helps you make informed decisions'
    },
    {
      icon: PhoneIcon,
      title: 'Support',
      description: '24/7 customer support to assist with any questions or issues'
    }
  ];

  return (
    <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            How Aqualink Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 px-4">
            Simple, secure, and efficient for everyone
          </p>
        </div>

        {/* Three Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16">
          {/* For Buyers */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4 sm:mb-6 mx-auto">
              <ShoppingCartIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              For Buyers
            </h3>
            <div className="space-y-4 sm:space-y-6">
              {buyerSteps.map((step, index) => (
                <div key={index} className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg">
                      <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">{step.title}</h4>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Sellers */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-cyan-100 rounded-full mb-4 sm:mb-6 mx-auto">
              <ClipboardDocumentCheckIcon className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              For Sellers
            </h3>
            <div className="space-y-4 sm:space-y-6">
              {sellerSteps.map((step, index) => (
                <div key={index} className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-cyan-50 rounded-lg">
                      <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center w-6 h-6 bg-cyan-600 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">{step.title}</h4>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust & Safety */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-4 sm:mb-6 mx-auto">
              <ShieldCheckIcon className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              Trust & Safety
            </h3>
            <div className="space-y-4 sm:space-y-6">
              {trustFeatures.map((feature, index) => (
                <div key={index} className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">{feature.title}</h4>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 px-2">
            Ready to Get Started?
          </h3>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of buyers and sellers on Sri Lanka's trusted aquaculture marketplace
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-lg"
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
