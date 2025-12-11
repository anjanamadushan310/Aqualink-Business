import React, { useEffect, useState } from "react";
import axios from "axios";

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    axios.get("http://localhost:8080/api/banners")
      .then(res => {
        setBanners(res.data || []);
      })
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <div className="w-full h-[200px] xs:h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] xl:h-[600px] flex justify-center items-center bg-gradient-to-r from-blue-50 to-indigo-100">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xs xs:text-sm sm:text-base md:text-lg">Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen px-3 sm:px-4 lg:px-8">
      <div className="w-full h-[150px] xs:h-[180px] sm:h-[220px] md:h-[280px] lg:h-[350px] xl:h-[400px] 2xl:h-[450px] relative overflow-hidden rounded-lg shadow-2xl bg-black">
      
      {/* Main Banner Container */}
      <div className="relative w-full h-full">
        
        {/* Banner Images with Overlay */}
        <div className="relative overflow-hidden w-full h-full">
          <div 
            className="flex transition-all duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div key={banner.bannerId} className="w-full h-full flex-shrink-0 relative group">
                
                {/* Background Image */}
                <img
                  src={`http://localhost:8080${banner.imageUrl}`}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Responsive Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent xs:from-black/70 xs:via-black/20 sm:from-black/60 sm:via-black/15 md:from-black/50 md:via-black/10"></div>
                
                {/* Content Overlay - Responsive */}
                <div className="absolute inset-0 flex items-center justify-center xs:justify-start">
                  <div className="w-full px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                    <div className="max-w-full xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl text-center xs:text-left">
                      {/* Add your banner content here if needed */}
                    </div>
                  </div>
                </div>  
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Dots - Mobile First Responsive */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1 xs:space-x-2 sm:space-x-3 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex 
                    ? 'w-4 h-2 xs:w-5 xs:h-2 sm:w-6 sm:h-2 md:w-8 md:h-3 bg-orange-500' 
                    : 'w-2 h-2 xs:w-2 xs:h-2 sm:w-3 sm:h-3 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows - Mobile Optimized */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1)}
              className="absolute left-1 xs:left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-1.5 xs:p-2 sm:p-3 md:p-4 rounded-full transition-all duration-300 z-20 group"
            >
              <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1)}
              className="absolute right-1 xs:right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-1.5 xs:p-2 sm:p-3 md:p-4 rounded-full transition-all duration-300 z-20 group"
            >
              <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Bottom Wave removed to keep clean rectangle */}
      </div>
      </div>
    </div>
  );
}
