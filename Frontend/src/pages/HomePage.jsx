import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import BannerCarousel from '../components/home/BannerCarousel';
import StatsSection from '../components/home/StatsSection';
import CategoryGrid from '../components/home/CategoryGrid';
import FishSection from '../components/home/FishSection';
import ServicesSection from '../components/home/ServicesSection';
import IndustrialSection from '../components/home/IndustrialSection';
import HowItWorks from '../components/home/HowItWorks';
import Footer from '../components/home/Footer';

const HomePage = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    try {
      const response = await axios.get(`${API_URL}/home/data`);
      setHomeData(response.data);
    } catch (error) {
      console.error('Error fetching home page data:', error);
      // Set default empty data structure
      setHomeData({
        banners: [],
        featuredFish: [],
        topRatedServices: [],
        trendingProducts: [],
        statistics: {
          totalProducts: 0,
          totalServices: 0,
          totalSellers: 0,
          averageRating: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Banner Carousel */}
      <BannerCarousel />
      
      {/* Product Sections */}
      <div className="bg-gray-50 pt-6">
        <div id="fish-section" className="scroll-mt-20">
          <FishSection featured={homeData?.featuredFish} />
        </div>
        
        <div id="services-section" className="scroll-mt-20">
          <ServicesSection featured={homeData?.topRatedServices} />
        </div>
        
        <div id="industrial-section" className="scroll-mt-20">
          <IndustrialSection featured={homeData?.trendingProducts} />
        </div>
      </div>
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
