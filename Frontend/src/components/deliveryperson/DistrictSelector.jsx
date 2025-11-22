import React, { useState } from 'react';

const DistrictSelector = ({ districts, coverageData, onUpdate }) => {
  const [selectedProvince, setSelectedProvince] = useState('Western');

  const provinces = Object.keys(districts);
  const selectedDistricts = coverageData.selectedDistricts || [];
  const selectedTowns = coverageData.selectedTowns || {};

  // Debug logging
  React.useEffect(() => {
    console.log('DistrictSelector - Coverage Data:', coverageData);
    console.log('DistrictSelector - Selected Districts:', selectedDistricts);
    console.log('DistrictSelector - Selected Towns:', selectedTowns);
  }, [coverageData, selectedDistricts, selectedTowns]);

  const toggleDistrict = (district) => {
    const newSelectedDistricts = selectedDistricts.includes(district)
      ? selectedDistricts.filter(d => d !== district)
      : [...selectedDistricts, district];

    const newSelectedTowns = { ...selectedTowns };
    if (!selectedDistricts.includes(district)) {
      // Initialize empty array for towns - user will manually select
      newSelectedTowns[district] = [];
    } else {
      // Remove the district and all its selected towns
      delete newSelectedTowns[district];
    }

    onUpdate({
      selectedDistricts: newSelectedDistricts,
      selectedTowns: newSelectedTowns
    });
  };

  const toggleTown = (district, town) => {
    const newSelectedTowns = { ...selectedTowns };
    if (!newSelectedTowns[district]) {
      newSelectedTowns[district] = [];
    }

    if (newSelectedTowns[district].includes(town)) {
      newSelectedTowns[district] = newSelectedTowns[district].filter(t => t !== town);
    } else {
      newSelectedTowns[district] = [...newSelectedTowns[district], town];
    }

    onUpdate({ selectedTowns: newSelectedTowns });
  };

  const selectAllTowns = (district, towns) => {
    const newSelectedTowns = { ...selectedTowns };
    const allTownsSelected = newSelectedTowns[district]?.length === towns.length;

    if (allTownsSelected) {
      // Deselect all towns
      newSelectedTowns[district] = [];
    } else {
      // Select all towns
      newSelectedTowns[district] = [...towns];
    }

    onUpdate({ selectedTowns: newSelectedTowns });
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Province</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {provinces.map(province => (
            <button
              key={province}
              onClick={() => setSelectedProvince(province)}
              className={`p-3 rounded-lg font-medium transition duration-200 ${
                selectedProvince === province
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {province}
            </button>
          ))}
        </div>
      </div>

      
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Districts in {selectedProvince} Province
        </h4>
        
        <div className="space-y-4">
          {Object.entries(districts[selectedProvince]).map(([district, towns]) => (
            <div key={district} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* District Header */}
              <div className="bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`district-${district}`}
                      checked={selectedDistricts.includes(district)}
                      onChange={() => toggleDistrict(district)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`district-${district}`}
                      className="text-lg font-semibold text-gray-900 cursor-pointer"
                    >
                      {district}
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">
                      {selectedTowns[district]?.length || 0} / {towns.length} towns selected
                    </div>
                    {selectedDistricts.includes(district) && (
                      <button
                        onClick={() => selectAllTowns(district, towns)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition duration-200 ${
                          selectedTowns[district]?.length === towns.length
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                        }`}
                      >
                        {selectedTowns[district]?.length === towns.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Towns Grid */}
              {selectedDistricts.includes(district) && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {towns.map(town => (
                      <label
                        key={town}
                        className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTowns[district]?.includes(town) || false}
                          onChange={() => toggleTown(district, town)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900">{town}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DistrictSelector;
