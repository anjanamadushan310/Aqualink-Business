import React, { useState, useEffect } from 'react';
import FishCard from './FishCard';
import SearchBar from './SearchBar';

const FishSection = () => {
  const [fishList, setFishList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFish, setFilteredFish] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  useEffect(() => {
    fetchFishData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFish(fishList);
      setCurrentPage(1); // reset to first page on search clear or fishList update
    } else {
      const filtered = fishList.filter((fish) =>
        fish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fish.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFish(filtered);
      setCurrentPage(1); // reset to first page on filtering
    }
  }, [searchQuery, fishList]);

  const fetchFishData = async () => {
    try {
       //const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/fish', {
        //headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      
      // Sort by average rating (highest to lowest)
      const sortedData = data.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });
      
      setFishList(sortedData);
      setFilteredFish(sortedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fish data:', error);
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredFish.length / cardsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Get the fish cards for the current page
  const startIndex = (currentPage - 1) * cardsPerPage;
  const currentCards = filteredFish.slice(startIndex, startIndex + cardsPerPage);

  if (loading) {
    return (
      <section className="mb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fish...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-20 px-2 sm:px-2 lg:px-2">
     
        

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search for fish by name or description..."
      />

      {filteredFish.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No fish found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search terms' : 'No fish available at the moment'}
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
            {currentCards.map((fish) => (
              <FishCard key={fish.id} fish={fish} onPurchaseSuccess={fetchFishData} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default FishSection;
