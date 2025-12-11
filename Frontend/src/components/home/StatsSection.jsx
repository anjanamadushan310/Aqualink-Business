import React, { useEffect, useState, useRef } from 'react';
import { ShoppingBagIcon, UserGroupIcon, BuildingStorefrontIcon, StarIcon } from '@heroicons/react/24/outline';

const StatsSection = ({ statistics }) => {
  const [counts, setCounts] = useState({
    products: 0,
    services: 0,
    sellers: 0,
    rating: 0
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  const animateCounters = () => {
    if (!statistics) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCounts({
        products: Math.floor((statistics.totalProducts || 0) * progress),
        services: Math.floor((statistics.totalServices || 0) * progress),
        sellers: Math.floor((statistics.totalSellers || 0) * progress),
        rating: ((statistics.averageRating || 0) * progress).toFixed(1)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts({
          products: statistics.totalProducts || 0,
          services: statistics.totalServices || 0,
          sellers: statistics.totalSellers || 0,
          rating: (statistics.averageRating || 0).toFixed(1)
        });
      }
    }, interval);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCounters();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnimated]);

  const stats = [
    {
      icon: ShoppingBagIcon,
      label: 'Products Listed',
      value: counts.products,
      suffix: '+',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: BuildingStorefrontIcon,
      label: 'Services Available',
      value: counts.services,
      suffix: '+',
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    },
    {
      icon: UserGroupIcon,
      label: 'Active Sellers',
      value: counts.sellers,
      suffix: '+',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: StarIcon,
      label: 'Average Rating',
      value: counts.rating,
      suffix: '/5.0',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  ];

  return (
    <div ref={sectionRef} className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Trusted by Thousands Across Sri Lanka
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 px-4">
            Join our growing community of buyers and sellers
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="relative group">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 lg:p-8 text-center transform group-hover:-translate-y-2">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${stat.bgColor} rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${stat.iconColor}`} />
                </div>

                {/* Value */}
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {stat.value}{stat.suffix}
                </div>

                {/* Label */}
                <div className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium leading-tight">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Trust Indicators */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 text-gray-600 text-sm sm:text-base px-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold whitespace-nowrap">Verified Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold whitespace-nowrap">Secure Transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span className="font-semibold whitespace-nowrap">Quality Assured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
