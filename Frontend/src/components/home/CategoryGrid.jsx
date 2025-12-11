import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBagIcon, 
  WrenchScrewdriverIcon, 
  BeakerIcon,
  NewspaperIcon 
} from '@heroicons/react/24/outline';

const CategoryGrid = () => {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'Fish & Seafood',
      description: 'Fresh fish from verified sellers',
      icon: ShoppingBagIcon,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
      link: '#fish-section'
    },
    {
      title: 'Equipment & Supplies',
      description: 'Aquarium & industrial supplies',
      icon: BeakerIcon,
      gradient: 'from-cyan-500 to-cyan-600',
      hoverGradient: 'hover:from-cyan-600 hover:to-cyan-700',
      link: '#industrial-section'
    },
    {
      title: 'Professional Services',
      description: 'Expert aquaculture services',
      icon: WrenchScrewdriverIcon,
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'hover:from-green-600 hover:to-green-700',
      link: '#services-section'
    },
    {
      title: 'Industry Blog',
      description: 'News, tips & insights',
      icon: NewspaperIcon,
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-700',
      link: '/blog'
    }
  ];

  const handleCategoryClick = (link) => {
    if (link.startsWith('#')) {
      const element = document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate(link);
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Explore Our Marketplace
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 px-4">
            Everything you need for your aquaculture business
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => handleCategoryClick(category.link)}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-blue-300 w-full"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${category.hoverGradient} transition-all duration-300`} />
              
              {/* Content */}
              <div className="relative p-6 sm:p-8 text-white text-left">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 rounded-full mb-3 sm:mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <category.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold mb-2 leading-tight">
                  {category.title}
                </h3>

                {/* Description */}
                <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                  {category.description}
                </p>

                {/* Arrow Icon */}
                <div className="mt-3 sm:mt-4 flex items-center text-sm sm:text-base font-semibold">
                  Explore
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -right-6 -top-6 sm:-right-8 sm:-top-8 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
