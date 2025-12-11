import React, { useState, useEffect } from 'react';
import ServiceCard from './ServiceCard';
import SearchBar from './SearchBar';

const ServicesSection = () => {
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const cardsPerPage = 8;

  useEffect(() => {
    fetchServicesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    // Extract unique categories
    const uniqueCategories = [...new Set(servicesList.map(service => service.category))];
    setCategories(uniqueCategories);
  }, [servicesList]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(servicesList);
      setCurrentPage(1);
    } else {
      searchServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, servicesList]);

  const fetchServicesData = async () => {
    try {
      setLoading(true);
      // Fetch all data for client-side pagination and sorting
      const params = new URLSearchParams({
        page: 0,
        size: 1000 // Get all services
      });

      let url = 'http://localhost:8080/api/services';
      if (selectedCategory) {
        url = `http://localhost:8080/api/services/category/${selectedCategory}`;
      }

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      // Sort by average rating (highest to lowest)
      const sortedContent = (data.content || []).sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });
      
      setServicesList(sortedContent);
      setFilteredServices(sortedContent);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services data:', error);
      setLoading(false);
    }
  };

  const searchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        query: searchQuery,
        page: 0,
        size: 1000 // Get all results for search
      });

      const response = await fetch(`http://localhost:8080/api/services/search?${params}`);
      const data = await response.json();
      
      // Sort search results by average rating (highest to lowest)
      const sortedResults = (data.content || []).sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });
      
      setFilteredServices(sortedResults);
      setCurrentPage(1);
      setLoading(false);
    } catch (error) {
      console.error('Error searching services:', error);
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredServices.length / cardsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setSearchQuery('');
  };

  // Get the service cards for the current page
  const startIndex = (currentPage - 1) * cardsPerPage;
  const currentCards = filteredServices.slice(startIndex, startIndex + cardsPerPage);

  if (loading) {
    return (
      <section className="mb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-20 px-2 sm:px-2 lg:px-2">
      <div className="mb-12">
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Our Services
        </h3>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === '' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search for services by name or category..."
      />

      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛠️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search terms' : 'No services available at the moment'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md sm:rounded-full border border-gray-300 text-sm sm:text-base ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-200 bg-white'
              }`}
              aria-label="Previous"
            >
              <span className="hidden sm:inline">&#8592;</span>
              <span className="sm:hidden">← Prev</span>
            </button>
            <span className="text-gray-700 text-sm sm:text-base font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md sm:rounded-full border border-gray-300 text-sm sm:text-base ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-200 bg-white'
              }`}
              aria-label="Next"
            >
              <span className="hidden sm:inline">&#8594;</span>
              <span className="sm:hidden">Next →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {currentCards.map((service) => (
              <ServiceCard key={service.id} service={service} onBookingSuccess={fetchServicesData} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ServicesSection;
