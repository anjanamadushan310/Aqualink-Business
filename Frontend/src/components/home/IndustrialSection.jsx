import React, { useState, useEffect } from 'react';
import IndustrialStuffCard from './IndustrialStuffCard';
import SearchBar from './SearchBar';

const IndustrialSection = () => {
  const [industrialList, setIndustrialList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIndustrial, setFilteredIndustrial] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const cardsPerPage = 8;

  const categories = [
    'All Categories',
    'Fish Tanks & Aquariums',
    'Fish Food',
    'Water Treatment',
    'Filtration Systems',
    'Pumps & Air Stones',
    'Lighting',
    'Decorations',
    'Medications',
    'Testing Equipment',
    'Maintenance Tools',
    'Other'
  ];

  useEffect(() => {
    fetchIndustrialData();
  }, []);

  useEffect(() => {
    filterIndustrialData();
  }, [searchQuery, industrialList, selectedCategory]);

  const fetchIndustrialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8080/api/industrial', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Industrial data:', data);
      
      // Sort by average rating (highest to lowest)
      const sortedData = data.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });
      
      setIndustrialList(sortedData);
      setFilteredIndustrial(sortedData);
    } catch (error) {
      console.error('Error fetching industrial data:', error);
      setError('Failed to load industrial supplies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterIndustrialData = () => {
    let filtered = [...industrialList];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((industrial) =>
        industrial.name.toLowerCase().includes(query) ||
        industrial.description.toLowerCase().includes(query) ||
        industrial.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'All Categories') {
      filtered = filtered.filter((industrial) => 
        industrial.category === selectedCategory
      );
    }

    // Sort by average rating (highest to lowest)
    filtered.sort((a, b) => {
      const ratingA = a.averageRating || 0;
      const ratingB = b.averageRating || 0;
      return ratingB - ratingA;
    });

    setFilteredIndustrial(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const totalPages = Math.ceil(filteredIndustrial.length / cardsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Get the industrial stuff cards for the current page
  const startIndex = (currentPage - 1) * cardsPerPage;
  const currentCards = filteredIndustrial.slice(startIndex, startIndex + cardsPerPage);

  if (loading) {
    return (
      <section className="mb-20">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fish supplies...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-20">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Supplies</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchIndustrialData}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-20 px-2 sm:px-2 lg:px-2">
      <div className="mb-8">
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Fish Supplies & Equipment
        </h3>
        <p className="text-gray-600 text-lg">
          Everything you need for your aquarium - from tanks to medications
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          placeholder="Search for fish supplies, tanks, food, chemicals..."
        />
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category === 'All Categories' ? '' : category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                (selectedCategory === category || (selectedCategory === '' && category === 'All Categories'))
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {(searchQuery || selectedCategory) && (
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredIndustrial.length} item{filteredIndustrial.length !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
        </div>
      )}

      {filteredIndustrial.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No fish supplies found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || selectedCategory 
              ? 'Try adjusting your search terms or category filter' 
              : 'No fish supplies available at the moment'}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md border ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                ← Previous
              </button>
              
              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md border ${
                  currentPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                Next →
              </button>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {currentCards.map((industrial) => (
              <IndustrialStuffCard 
                key={industrial.id} 
                industrial={industrial} 
                onPurchaseSuccess={fetchIndustrialData}
              />
            ))}
          </div>

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default IndustrialSection;
